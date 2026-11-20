/** Five commercial Thuisbatterij Team HYXI AURA packages; never list Q7 as for-sale.
 * Values describe nominal/usable capacity. Consumer prices await confirmed column labels.
 */
import { MODULES } from './product-data.mjs';

export const OFFERED_PACKAGES = Object.freeze([
  ['single',1,5],['single',2,5],['three',1,10],['three',2,10],['three',3,10],
].map(([phase,count,inverterKw])=>Object.freeze({
  id: phase+'-'+count+'q9',phase,count,inverterKw,moduleType:9,
  phaseLabel: phase==='single'?'1 fase':'3 fasen',
  advertisedKwh:count*9,
  nominal:Math.round(MODULES[9].nominal*count*100)/100,
  usable:Math.round(MODULES[9].usable*count*10)/10,
  backup:true,
})));

export function configuration(phase='single',count=1) {
  const pack=OFFERED_PACKAGES.find(p=>p.phase===phase && p.count===count);
  if(!pack)throw new RangeError('Kies één van de vijf BAT-Q9-pakketten.');
  return Object.freeze({...pack,type:9,module:MODULES[9]});
}
export const decimal=(value,maximumFractionDigits=2)=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits}).format(value);
