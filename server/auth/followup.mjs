// Validate encrypted-only Beheer follow-up content before touching the database.
const controls = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;
export function parseFollowupInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).sort().join(',') !== 'dueDate,nextAction,note') return null;
  const {nextAction, dueDate, note} = input;
  if (typeof nextAction !== 'string' || typeof note !== 'string') return null;
  const action = nextAction.trim(), message = note.trim();
  if (action.length > 180 || /[\r\n]/.test(action) || controls.test(action) ||
      message.length > 1000 || controls.test(message)) return null;
  if (dueDate !== null) {
    if (typeof dueDate !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(dueDate)) return null;
    const parsed = new Date(dueDate+'T00:00:00.000Z');
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== dueDate) return null;
  }
  return {nextAction:action, dueDate, note:message};
}
export function normalizeFollowup(payload) {
  const entry = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  return {
    nextAction:typeof entry.nextAction==='string'?entry.nextAction:'',
    dueDate:typeof entry.dueDate==='string'?entry.dueDate:null,
    notes:Array.isArray(entry.notes)?entry.notes:[]
  };
}
