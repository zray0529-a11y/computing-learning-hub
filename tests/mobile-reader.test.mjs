import test from 'node:test';
import assert from 'node:assert/strict';
import {visualReadingCards,visualCardIndex} from '../site-src/visual-core.mjs';
import {lessons as foundations} from '../site-src/lessons/foundations.mjs';
import {lessons as systems} from '../site-src/lessons/systems.mjs';
import {lessons as architecture} from '../site-src/lessons/architecture.mjs';

test('every lesson offers each diagram step and activity once in its mobile reading order',()=>{
  for(const lesson of [...foundations,...systems,...architecture]){
    const cards=visualReadingCards(lesson);
    assert.deepEqual(cards.filter(card=>card.step!==undefined).map(card=>card.step),[-1,...lesson.steps.map((_,index)=>index)],lesson.path);
    assert.equal(new Set(cards.map(card=>card.key)).size,cards.length,'Each card must be independently addressable');
    assert.equal(cards.filter(card=>card.section==='visual-lab').length,lesson.lab?1:0);
    assert.equal(cards.filter(card=>card.section==='visual-analogy').length,lesson.analogy?1:0);
    assert.deepEqual(cards.slice(-3).map(card=>card.section),['visual-boundary','visual-check','visual-next']);
    assert.ok(cards.every(card=>card.label));
  }
});

test('section links and resumed card keys restore the right mobile activity without hiding an anchor',()=>{
  const cards=visualReadingCards(foundations[0]);
  for(const section of ['visual-explainer','visual-lab','visual-analogy','visual-boundary','visual-check','visual-next']){
    assert.equal(cards[visualCardIndex(cards,section)].section,section);
  }
  assert.equal(visualCardIndex(cards,'visual-explainer'),0,'The diagram anchor opens its overview');
  assert.equal(visualCardIndex(cards,null),0);
  assert.equal(visualCardIndex(cards,'missing-section'),0);
  assert.equal(visualCardIndex(visualReadingCards(foundations[1]),'visual-lab'),0,'Absent optional panels cannot leave an empty reader');
  for(const card of cards)assert.equal(cards[visualCardIndex(cards,null,card.key)].key,card.key,'Saved steps and activities must resume in place');
  assert.equal(visualCardIndex(cards,null,'old-card-key'),0,'A stale saved key safely opens the overview');
  assert.equal(cards[visualCardIndex(cards,'visual-check','step-2')].key,'check','Explicit section links take precedence over saved progress');
  assert.equal(visualCardIndex(cards,'missing-section','step-2'),0,'An explicit but unknown anchor cannot silently resume another activity');
});
