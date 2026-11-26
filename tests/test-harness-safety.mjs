// Browser QA must run against a loopback fixture. Production form posts are
// never an acceptable fallback when a stub or local server is unavailable.
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

export function assertSafeBrowserOrigin(rawOrigin) {
  let url;
  try { url = new URL(rawOrigin); } catch { throw new Error('Browser QA requires a valid loopback origin.'); }
  if (url.protocol !== 'http:' || !LOOPBACK_HOSTS.has(url.hostname)) {
    throw new Error(`Refusing browser QA outside a loopback origin: ${url.origin}`);
  }
  return url.origin;
}

export async function installLeadFailClosedGuard(page) {
  const blocked = [];
  await page.route('**/api/leads**', async route => {
    const url = new URL(route.request().url());
    if (!LOOPBACK_HOSTS.has(url.hostname)) {
      blocked.push(url.origin + url.pathname);
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
  return () => {
    if (blocked.length) throw new Error(`Browser QA blocked a non-loopback lead request: ${blocked.join(', ')}`);
  };
}
