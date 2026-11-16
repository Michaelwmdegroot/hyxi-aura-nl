import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDeletionConfirmation} from '../server/auth/privacy.mjs';

const id='AURA-1c000000-1111-4111-8111-222222222222';
const valid={
  confirmedRequestId:id,
  reason:'retention_reviewed',
  legalReviewConfirmed:true,
  acknowledgedExternalCopies:true,
};

test('manual privacy deletion requires exact request ID, reason and two affirmative reviews',()=>{
  assert.deepEqual(validateDeletionConfirmation(id,valid),{reason:'retention_reviewed'});
  assert.deepEqual(validateDeletionConfirmation(id,{...valid,reason:'verified_privacy_request'}),{reason:'verified_privacy_request'});
  const invalid=[
    null,[],{}, {...valid,confirmedRequestId:'AURA-wrong'},
    {...valid,reason:'bulk_delete'}, {...valid,reason:5},
    {...valid,legalReviewConfirmed:false},{...valid,acknowledgedExternalCopies:false},
    {...valid,hidden:'extra'},
  ];
  for(const example of invalid)assert.equal(validateDeletionConfirmation(id,example),null);
  assert.equal(validateDeletionConfirmation('bad id',valid),null);
});

test('no default removal, automatic retention trigger or public export in the validation module',()=>{
  assert.equal(validateDeletionConfirmation(id,undefined),null);
  assert.equal(validateDeletionConfirmation(id,{...valid,reason:'automatic_6_months'}),null);
});
