// HYXI AURA Beheer — read-only due-date helpers.
// Use the Dutch local calendar, never UTC midnight or browser locale.
const dutchDate = new Intl.DateTimeFormat('en-GB',{
  timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit',
});
const datePattern=/^20\d{2}-\d{2}-\d{2}$/;
export const CLOSED_FOLLOWUP_STATUSES=new Set(['won','lost','not_suitable']);

export function todayInAmsterdam(instant = new Date()){
  const value=instant instanceof Date ? instant : new Date(instant);
  if(!Number.isFinite(value.getTime()))throw new Error('Invalid reference date.');
  const parts=Object.fromEntries(dutchDate.formatToParts(value).map(part=>[part.type,part.value]));
  return parts.year+'-'+parts.month+'-'+parts.day;
}

export function classifyFollowup(dueDate,status,today){
  if(CLOSED_FOLLOWUP_STATUSES.has(status)||typeof dueDate!=='string'||!datePattern.test(dueDate)||dueDate>today)return null;
  return dueDate<today?'overdue':'today';
}
