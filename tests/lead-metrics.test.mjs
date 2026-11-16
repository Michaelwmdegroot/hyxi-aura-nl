import test from 'node:test';
import assert from 'node:assert/strict';
import {metricWindow,buildLeadKpis} from '../server/auth/metrics.mjs';

test('rolling UTC period spans year boundary and creates inclusive 14-day labels',()=>{
  const w=metricWindow('2027-01-03T23:30:00Z');
  assert.equal(w.start,'2026-12-21');
  assert.equal(w.end,'2027-01-03');
  assert.equal(w.endExclusive,'2027-01-04');
  assert.equal(w.dayKeys.length,14);
  assert.throws(()=>metricWindow('invalid'));
  assert.throws(()=>metricWindow(new Date(),999));
});
test('zero fills missing days, separates advice/quotes and never derives a fake conversion rate',()=>{
  const w=metricWindow('2026-11-16T23:30:00Z',3);
  const result=buildLeadKpis([
    {day:'2026-11-14',total:'3',advice:'2',quote:'1'},
    {day:'2026-11-16',total:'2',advice:'1',quote:'0'},
  ],w,'all');
  assert.equal(result.period.timezone,'UTC');
  assert.deepEqual(result.totals,{received:5,advice:3,quote:1,other:1});
  assert.deepEqual(result.days.map(x=>x.total),[3,0,2]);
  assert.equal(result.days[1].day,'2026-11-15');
  assert.equal(Object.hasOwn(result,'conversionRate'),false);
  assert.doesNotMatch(JSON.stringify(result),/@example|061234/);
});
test('rejects impossible totals instead of presenting fake KPI data',()=>{
  const w=metricWindow('2026-11-16T10:00:00Z',1);
  assert.throws(()=>buildLeadKpis([{day:w.start,total:1,advice:2,quote:0}],w,'all'));
});
