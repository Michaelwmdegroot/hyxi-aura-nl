// HYXI AURA — genuine aggregate lead KPIs; no visitor tracking, PII, or third-party pixels.
const DAY=86_400_000;
const DATE=/^\d{4}-\d{2}-\d{2}$/;

export function metricWindow(instant=new Date(),days=14){
  const now=instant instanceof Date?instant:new Date(instant);
  if(!Number.isFinite(now.getTime())||!Number.isInteger(days)||days<1||days>60)
    throw new Error('Invalid KPI window');
  const today=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
  const start=today-(days-1)*DAY, end=today+DAY;
  const dayKeys=Array.from({length:days},(_,i)=>new Date(start+i*DAY).toISOString().slice(0,10));
  return {start:dayKeys[0],end:dayKeys.at(-1),endExclusive:new Date(end).toISOString().slice(0,10),dayKeys};
}

export function buildLeadKpis(rows,window,scope){
  const byDate=new Map();
  for(const row of rows){
    const day=String(row.day||'');
    if(!DATE.test(day)||!window.dayKeys.includes(day))continue;
    const total=Number(row.total),advice=Number(row.advice),quote=Number(row.quote);
    if(![total,advice,quote].every(v=>Number.isSafeInteger(v)&&v>=0)||advice+quote>total)
      throw new Error('Invalid aggregate from database');
    byDate.set(day,{day,total,advice,quote,other:total-advice-quote});
  }
  const values=window.dayKeys.map(day=>byDate.get(day)||{day,total:0,advice:0,quote:0,other:0});
  const sum=key=>values.reduce((acc,item)=>acc+item[key],0);
  return {
    period:{from:window.start,through:window.end,days:window.dayKeys.length,timezone:'UTC'},
    scope,totals:{received:sum('total'),advice:sum('advice'),quote:sum('quote'),other:sum('other')},
    days:values,
    caveat:'Gecommitte en nog aanwezige HYXI-dossiers naar ontvangstdatum in UTC. Geen bezoeken, conversiepercentage of werkelijk eerste contact gemeten.',
  };
}

export function createLeadMetrics({pool}){
  if(!pool||typeof pool.query!=='function')throw new Error('MySQL pool required');
  async function leadMetrics(actor,{now=new Date()}={}){
    if(!actor||!['admin','sales'].includes(actor.role))throw Object.assign(new Error('Forbidden'),{code:'FORBIDDEN'});
    const window=metricWindow(now);
    const roleFilter=actor.role==='sales'?' AND l.assigned_user_id=?':'';
    const params=[window.start+' 00:00:00',window.endExclusive+' 00:00:00'];
    if(actor.role==='sales')params.push(actor.id);
    const [rows]=await pool.query(
      "SELECT DATE_FORMAT(l.created_at,'%Y-%m-%d') AS day,"+
      "COUNT(*) AS total,"+
      "SUM(CASE WHEN l.request_type='advice' THEN 1 ELSE 0 END) AS advice,"+
      "SUM(CASE WHEN l.request_type='quote' THEN 1 ELSE 0 END) AS quote "+
      "FROM aura_leads l WHERE l.created_at>=? AND l.created_at<?"+roleFilter+
      " GROUP BY DATE_FORMAT(l.created_at,'%Y-%m-%d') ORDER BY day ASC",
      params,
    );
    return buildLeadKpis(rows,window,actor.role==='admin'?'all':'assigned');
  }
  return {leadMetrics};
}
