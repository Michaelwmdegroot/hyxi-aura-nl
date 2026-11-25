import test from 'node:test';
import assert from 'node:assert/strict';
import {publishAcceptedLeadSignal} from '../src/lead-conversion-signal.mjs';

test('a confirmed advice or quote can signal exactly its type, without identifiable data',()=>{
  const sent=[];
  class SimpleEvent {
    constructor(type, options){this.type=type;this.detail=options.detail;}
  }
  const fakeHost={CustomEvent:SimpleEvent,dispatchEvent:e=>{sent.push(e);return true;}};
  assert.equal(publishAcceptedLeadSignal('advice',fakeHost),true);
  assert.equal(publishAcceptedLeadSignal('quote',fakeHost),true);
  assert.deepEqual(sent.map(e=>[e.type,e.detail]),[
    ['hyxi:lead-accepted',{intent:'advice'}],
    ['hyxi:lead-accepted',{intent:'quote'}]
  ]);
  assert.deepEqual(Object.keys(sent[0].detail),['intent'],'no email, phone, postcode or receipt id ever emitted');
  assert.ok(Object.isFrozen(sent[0].detail));
});

test('invalid/no event destinations cannot trigger conversion data or affect lead processing',()=>{
  const sent=[];
  class E {constructor(type,o){this.type=type;this.detail=o.detail;}}
  const host={CustomEvent:E,dispatchEvent:x=>sent.push(x)};
  for(const key of ['submit','pageview','test','',null,undefined]) assert.equal(publishAcceptedLeadSignal(key,host),false);
  assert.equal(sent.length,0);
  assert.equal(publishAcceptedLeadSignal('advice',{}),false);
  const throwing={CustomEvent:E,dispatchEvent:()=>{throw Error('tracking blocked');}};
  assert.equal(publishAcceptedLeadSignal('advice',throwing),false,'conversion signal must never break successful form');
});
