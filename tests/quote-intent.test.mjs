import test from 'node:test';
import assert from 'node:assert/strict';
import {validateLead} from '../server/validation.mjs';
import {buildLeadMail} from '../server/mail.mjs';

const sample={
  fullName:'Fictieve Offerteklant',
  email:'test@example.test',phone:'0612345678',postcode:'1234AB',
  consent:true,website:'',
  profile:{solar:'planned',annualUsage:null,goal:'unsure',phase:'unknown',moduleType:9,moduleCount:2},
};
const mailConfig={smtp:{from:'testsender@example.test',to:'leads@example.test'}};
const id='AURA-11111111-2222-4333-8444-555555555555';

test('quote intent and additional wishes are strictly validated without breaking advice',()=>{
  const advice=validateLead(sample);
  assert.equal(advice.success,true);
  assert.equal(advice.data.intent,undefined);
  const quote=validateLead({...sample,intent:'quote',projectDetails:'Bestaande zonnepanelen; graag installatieadvies.'});
  assert.equal(quote.success,true);
  assert.equal(quote.data.intent,'quote');
  assert.equal(quote.data.projectDetails,'Bestaande zonnepanelen; graag installatieadvies.');
  for(const bad of [
    {...sample,intent:'unknown'},
    {...sample,intent:'quote',projectDetails:'x'.repeat(1001)},
    {...sample,intent:'quote',projectDetails:'onveilig\u0000'},
    {...sample,intent:'quote',consent:false},
    {...sample,intent:'quote',profile:{...sample.profile,moduleCount:7}},
  ])assert.equal(validateLead(bad).success,false);
});

test('mail type and project wishes match the stored quote, advice remains unchanged',()=>{
  const quote=validateLead({...sample,intent:'quote',projectDetails:'Met back-up voor specifieke groepen.'}).data;
  const offerMail=buildLeadMail(mailConfig,quote,id,Date.UTC(2026,10,15));
  assert.match(offerMail.subject,/Nieuwe offerteaanvraag/);
  assert.match(offerMail.text,/Nieuwe HYXI AURA offerteaanvraag/);
  assert.match(offerMail.text,/Met back-up voor specifieke groepen/);
  assert.equal(offerMail.to,'leads@example.test');
  assert.equal(offerMail.messageId,'<'+id+'@hyxi-aura.nl>');
  const adviceMail=buildLeadMail(mailConfig,sample,id,Date.UTC(2026,10,15));
  assert.match(adviceMail.subject,/Nieuwe adviesaanvraag/);
  assert.doesNotMatch(adviceMail.text,/Aanvullende wensen/);
});
