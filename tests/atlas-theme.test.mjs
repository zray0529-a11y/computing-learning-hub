import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {bundleThree} from '../scripts/bundle-three.mjs';
import {createAtlasScene} from '../site-src/atlas-scene.mjs';
import {atlasCategories, atlasNodes, atlasEdges, atlasScenarios} from '../site-src/atlas-data.mjs';
import {atlasHistory} from '../site-src/atlas-history.mjs';

// Only the browser DOM and animation scheduling are replaced. The scene,
// geometries, materials, OrbitControls, projection and SVG rendering are real.
function sceneEnvironment() {
  const doc = new EventTarget(), win = new EventTarget(), frames = new Map();
  let nextFrame = 0;
  class Element extends EventTarget {
    constructor(tag) {
      super(); this.tagName = tag; this.ownerDocument = doc; this.childNodes = [];
      this.dataset = {}; this.attributes = new Map();
      this.style = {setProperty(name, value) { this[name] = value; }};
      const classes = new Set();
      this.classList = {toggle(name, active) { if (active) classes.add(name); else classes.delete(name); }};
    }
    append(...children) { children.forEach(child => this.appendChild(child)); }
    appendChild(child) { child.remove(); this.childNodes.push(child); child.parentNode = this; return child; }
    removeChild(child) { this.childNodes.splice(this.childNodes.indexOf(child), 1); child.parentNode = null; return child; }
    remove() { this.parentNode?.removeChild(this); }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    removeAttribute(name) { this.attributes.delete(name); }
    getRootNode() { return doc; }
    getContext() { return null; }
    getBoundingClientRect() { return {left:0, top:0, width:900, height:600}; }
  }
  doc.createElement = tag => new Element(tag);
  doc.createElementNS = (_namespace, tag) => new Element(tag);
  doc.documentElement = doc.createElement('html');
  doc.documentElement.dataset.theme = 'dark';
  doc.defaultView = win;
  win.performance = {now: () => 0};
  win.requestAnimationFrame = callback => { frames.set(++nextFrame, callback); return nextFrame; };
  win.cancelAnimationFrame = id => frames.delete(id);
  const context = {console, URL, AbortController, document:doc};
  context.globalThis = context;
  vm.runInNewContext(bundleThree(), context, {timeout:10000});
  win.KnowledgeThree = context.KnowledgeThree;
  return {doc, win, host:doc.createElement('div'), flush() {
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(callback => callback(0));
  }};
}

test('all atlas models render in dark mode and survive a light-dark round trip', () => {
  const env = sceneEnvironment(), errors = [];
  const atlas = {categories:atlasCategories, nodes:atlasNodes, edges:atlasEdges, scenarios:atlasScenarios, history:atlasHistory};
  const controller = createAtlasScene(env.host, {atlas, onError:message => errors.push(message)});
  try {
    env.flush();
    assert.deepEqual(errors, [], 'real catalog models must not trigger the list fallback');
    const wrapper = env.host.childNodes.find(node => node.className === 'atlas-scene');
    assert.ok(wrapper, 'the interactive scene must remain mounted');
    const svg = wrapper.childNodes.find(node => node.tagName === 'svg');
    const renderedStyles = () => {
      assert.ok(svg.childNodes.length > atlasNodes.length, 'models must produce visible SVG geometry');
      for (const path of svg.childNodes) assert.doesNotMatch(path.getAttribute('d') || '', /NaN|Infinity/);
      return svg.childNodes.map(path => path.getAttribute('style')).join('\n');
    };
    const dark = renderedStyles();
    env.doc.documentElement.dataset.theme = 'light';
    env.win.dispatchEvent(new Event('clh:themechange')); env.flush();
    assert.notEqual(renderedStyles(), dark, 'theme switching must recolor rendered materials');
    env.doc.documentElement.dataset.theme = 'dark';
    env.win.dispatchEvent(new Event('clh:themechange')); env.flush();
    assert.equal(renderedStyles(), dark, 'switching back must restore every model material');
    assert.deepEqual(errors, []);
  } finally { controller.dispose(); }
});
