import test from 'node:test';
import assert from 'node:assert/strict';
import {withViewTransition} from '../site-src/motion-upgrade.mjs';
import {bindHomeBinary} from '../site-src/visual-reader.mjs';

test('view transitions preserve each update once when interactions arrive before the snapshot callback', () => {
  const callbacks=[], updates=[];
  let skipped=0;
  const doc={defaultView:{matchMedia:()=>({matches:false})},startViewTransition(callback){
    callbacks.push(callback);
    return {skipTransition(){skipped++;},ready:Promise.resolve(),finished:new Promise(()=>{})};
  }};
  withViewTransition(()=>updates.push('first'),{document:doc});
  withViewTransition(()=>updates.push('second'),{document:doc});
  assert.deepEqual(updates,['first']);
  callbacks[1](); callbacks[0](); callbacks[1]();
  assert.deepEqual(updates,['first','second']);
  assert.equal(skipped,1);
});

test('reduced motion, initial render and unsupported transitions update synchronously', () => {
  let calls=0;
  for(const doc of [
    {defaultView:{matchMedia:()=>({matches:true})},startViewTransition(){throw new Error('must not animate');}},
    {defaultView:{}},
    {defaultView:{},startViewTransition(){throw new Error('unavailable document state');}},
  ]) withViewTransition(()=>calls++,{document:doc});
  const doc={defaultView:{},startViewTransition(){throw new Error('must skip initial animation');}};
  withViewTransition(()=>calls++,{document:doc,animate:false});
  assert.equal(calls,4);
});

test('a transition API failure after the DOM callback never executes that update twice', () => {
  let calls=0;
  const doc={defaultView:{},startViewTransition(callback){callback();throw new Error('snapshot failed');}};
  assert.throws(()=>withViewTransition(()=>calls++,{document:doc}),/snapshot failed/);
  assert.equal(calls,1);
});

function binaryFixture() {
  let click;
  const bits=[0,1,0,1];
  const buttons=bits.map((bit,index)=>{
    const strong={textContent:String(bit)},span={textContent:bit?'计入':'不计入'};
    return {dataset:{heroBit:String(index)},attributes:{'aria-pressed':String(Boolean(bit))},
      setAttribute(key,value){this.attributes[key]=value;},querySelector:selector=>selector==='strong'?strong:span};
  });
  const equation={textContent:'0 + 4 + 0 + 1 = 5'},caption={textContent:''};
  const flow={classList:{toggle(){}}};
  const root={addEventListener(type,handler){assert.equal(type,'click');click=handler;},contains:button=>buttons.includes(button),
    querySelector:selector=>selector==='#hero-bit-equation'?equation:selector==='#hero-bit-caption'?caption:flow};
  bindHomeBinary(root);
  return {buttons,equation,caption,toggle(index){click({target:{closest:()=>buttons[index]}});}};
}

test('home switches expose correct labels and arithmetic for all sixteen combinations without navigation', () => {
  const example=binaryFixture();
  const current=[0,1,0,1],weights=[8,4,2,1];
  for(let value=0;value<16;value++) {
    const bits=weights.map(weight=>Number(Boolean(value&weight)));
    bits.forEach((bit,index)=>{
      if(bit!==current[index]) {example.toggle(index);current[index]=bit;}
      assert.equal(example.buttons[index].attributes['aria-pressed'],String(Boolean(bit)));
      assert.equal(String(example.buttons[index].querySelector('strong').textContent),String(bit));
    });
    assert.equal(example.equation.textContent,bits.map((bit,index)=>bit*weights[index]).join(' + ')+' = '+value);
    assert.match(example.caption.textContent,new RegExp('^'+bits.join('')+' 表示 '+value+' ·'));
  }
  const fresh=binaryFixture();
  fresh.toggle(0);
  assert.equal(fresh.equation.textContent,'8 + 4 + 0 + 1 = 13');
  assert.equal(fresh.buttons[0].attributes['aria-label'],'位权 8，当前 1');
});
