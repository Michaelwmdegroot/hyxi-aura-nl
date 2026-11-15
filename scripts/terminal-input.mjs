import { createInterface } from 'node:readline/promises';
import { StringDecoder } from 'node:string_decoder';

export function requirePrivateTerminal() {
  if (!process.stdin.isTTY || !process.stdout.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('A private interactive terminal is required.');
  }
}

export async function askVisible(question) {
  requirePrivateTerminal();
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const abort = new AbortController();
  rl.once('SIGINT', () => abort.abort());
  try { return (await rl.question(question, { signal: abort.signal })).trim(); }
  finally { rl.close(); }
}

export async function askHidden(label) {
  requirePrivateTerminal();
  const input = process.stdin, output = process.stdout;
  output.write(label);
  return new Promise((resolve, reject) => {
    const priorRaw = Boolean(input.isRaw);
    const decoder = new StringDecoder('utf8');
    let value = '', escape = '', done = false;
    function finish(error) {
      if (done) return;
      done = true;
      input.off('data', onData);
      input.off('end', onEnd);
      input.off('error', onError);
      input.setRawMode(priorRaw);
      input.pause();
      output.write('\n');
      if (error) reject(error); else resolve(value);
    }
    const onEnd = () => finish(new Error('Input ended.'));
    const onError = () => finish(new Error('Input failed.'));
    function onData(buffer) {
      const chars = typeof buffer === 'string' ? buffer : decoder.write(buffer);
      for (const character of chars) {
        if (character === '\u0003' || character === '\u0004') return finish(new Error('Interrupted.'));
        if (escape) {
          escape += character;
          // Skip terminal navigation and bracketed-paste markers instead of
          // adding escape sequences to the user's password.
          if (/[A-Za-z~]$/.test(escape) || escape.length > 16) escape = '';
          continue;
        }
        if (character === '\u001b') { escape = character; continue; }
        if (character === '\r' || character === '\n') return finish();
        if (character === '\u007f' || character === '\b') { value = [...value].slice(0, -1).join(''); continue; }
        if (character < ' ' || character === '\u007f') continue;
        value += character;
        if (Buffer.byteLength(value) > 1024) return finish(new Error('Input too long.'));
      }
    }
    input.on('data', onData);
    input.once('end', onEnd);
    input.once('error', onError);
    input.setRawMode(true);
    input.resume();
  });
}
