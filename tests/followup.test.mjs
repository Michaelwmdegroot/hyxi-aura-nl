import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFollowupInput,normalizeFollowup} from '../server/auth/followup.mjs';

test('normalizes safe notes and strict UTC follow-up dates',()=>{
  assert.deepEqual(parseFollowupInput({nextAction:'  Terugbellen  ',dueDate:'2026-11-23',note:'  Eerste gesprek  '}),{nextAction:'Terugbellen',dueDate:'2026-11-23',note:'Eerste gesprek'});
  assert.deepEqual(normalizeFollowup(),{nextAction:'',dueDate:null,notes:[]});
});
test('blocks invalid, overlong and control-character follow-up input',()=>{
  const ok={nextAction:'Afspraak',dueDate:null,note:''};
  for(const input of [
    null,[],{...ok,hack:true},{...ok,note:42},{...ok,dueDate:'2026-02-30'},
    {...ok,dueDate:'not-a-date'},{...ok,note:'x'.repeat(1001)},
    {...ok,nextAction:'x'.repeat(181)},{...ok,nextAction:'New\nLine'},
    {...ok,note:'hidden\u0000'},
  ])assert.equal(parseFollowupInput(input),null);
});
