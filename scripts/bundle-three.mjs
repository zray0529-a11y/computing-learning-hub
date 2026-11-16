import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// These original upstream files are pinned to r180. This is a small mechanical
// ESM-to-IIFE wrapper, not a minifier. Keeping upstream minified files intact
// makes the standalone/offline reader reproducible without npm or a CDN.
const sources=[
 ['three.core.min.js','70c40977daa0f6e1e312c6b58e9bfe49cb5a87a4'],
 ['three.module.min.js','20d3c112761a519c7780a5ccc9f72a40937fa83b'],
 ['OrbitControls.js','eea26706dae735dade19367026185f6e68f5cf55'],
 ['Projector.js','2d3882984412fc266e2e71d47308335a4eac8552'],
 ['SVGRenderer.js','87f0c08acd67b81ea0c485ff9e322bd0ac25b97b']
];
const aliasPairs=text=>text.split(',').map(part=>{
 const pieces=part.trim().split(/\s+as\s+/);
 if(pieces.some(s=>!/^[$\w]+$/.test(s))||pieces.length>2)throw new Error('Unexpected Three.js export syntax');
 return pieces;
});

export function bundleThree() {
 const blocks=sources.map(([file,sha],index)=>{
  let code=readFileSync(new URL('../site-src/vendor/'+file,import.meta.url),'utf8');
  const actual=createHash('sha1').update('blob '+Buffer.byteLength(code)+'\0').update(code).digest('hex');
  if(actual!==sha)throw new Error('Pinned upstream Three.js file changed: '+file);
  if(index===1){
   let imports=0,reexports=0;
   code=code.replace(/import\{([^}]+)\}from"\.\/three\.core\.min\.js";/,(_,names)=>{
    imports++;return 'const {'+aliasPairs(names).map(([source,local])=>source+(local?':'+local:'')).join(',')+'}=globalThis.KnowledgeThree;';
   });
   code=code.replace(/export\{[^}]+\}from"\.\/three\.core\.min\.js";/,()=>{reexports++;return '';});
   if(imports!==1||reexports!==1)throw new Error('Three.js module wrapper drift');
  }
  if(index>=2){
   let imports=0;
   code=code.replace(/^import\s*\{([^}]+)\}\s*from\s*'three';/m,(_,names)=>{imports++;return 'const {'+names+'}=globalThis.KnowledgeThree;';});
   if(imports!==1)throw new Error('Three.js addon import wrapper drift: '+file);
  }
  if(index===4){
   let imports=0;
   code=code.replace(/^import\s*\{([^}]+)\}\s*from\s*'\.\.\/renderers\/Projector.js';/m,(_,names)=>{imports++;return 'const {'+names+'}=globalThis.KnowledgeThree;';});
   if(imports!==1)throw new Error('SVGRenderer projector wrapper drift');
  }
  let exports=0;
  code=code.replace(/export\s*\{([^}]+)\};\s*$/,(_,names)=>{
   exports++;return 'Object.assign(globalThis.KnowledgeThree,{'+aliasPairs(names).map(([local,name])=>(name||local)+':'+local).join(',')+'});';
  });
  if(exports!==1)throw new Error('Three.js export wrapper drift: '+file);
  return '(function(){\n"use strict";\n'+code+'\n})();';
 });
 const license=readFileSync(new URL('../site-src/vendor/LICENSE-three.md',import.meta.url),'utf8');
 return '/* Three.js r180 + OrbitControls + SVGRenderer. https://github.com/mrdoob/three.js/tree/r180\n'+license+'\n*/\nglobalThis.KnowledgeThree={};\n'+blocks.join('\n');
}
