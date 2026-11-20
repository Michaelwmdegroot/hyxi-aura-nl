import test from 'node:test';
import assert from 'node:assert/strict';
import { OFFERED_PACKAGES, configuration, decimal } from '../src/configurator-model.mjs';

test('commercial range contains exactly the five requested BAT-Q9/phase/inverter combinations',()=>{
  assert.equal(OFFERED_PACKAGES.length,5);
  assert.deepEqual(OFFERED_PACKAGES.map(x=>[x.phase,x.count,x.inverterKw,x.moduleType]),[
    ['single',1,5,9],['single',2,5,9],['three',1,10,9],['three',2,10,9],['three',3,10,9]
  ]);
  for(const pkg of OFFERED_PACKAGES){
    const state=configuration(pkg.phase,pkg.count);
    assert.equal(state.nominal,Math.round(9.04*pkg.count*100)/100);
    assert.equal(state.usable,Math.round(8.6*pkg.count*10)/10);
    assert.equal(state.advertisedKwh,9*pkg.count);
    assert.equal(state.type,9);
    assert.equal(state.backup,true);
  }
});
test('BAT-Q7, 4–6 modules and unsupported phase are never public packages',()=>{
  for(const args of [['single',3],['three',4],['single',0],['three',6],['unknown',1],[7,1],[9,1],['single',1.5],['three',NaN]]) assert.throws(()=>configuration(...args),RangeError);
});
test('Dutch decimal formatting preserves nominal versus usable capacity',()=>{
  assert.equal(decimal(configuration('three',3).nominal),'27,12');
  assert.equal(decimal(configuration('single',2).usable),'17,2');
});
