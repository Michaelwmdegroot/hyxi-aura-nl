import axe from 'axe-core';
const frame = document.querySelector('#site-preview');
document.querySelector('#width').addEventListener('change', event => frame.width = event.target.value);
document.querySelectorAll('[data-anchor]').forEach(button => button.addEventListener('click', () => frame.src = `/${button.dataset.anchor}`));
document.querySelector('#clear-audit').addEventListener('click', () => document.querySelector('#audit').textContent = '');
document.querySelector('#run-audit').addEventListener('click', async () => {
  const output = document.querySelector('#audit');
  output.textContent = 'Toegankelijkheid controleren…';
  try {
    if (!frame.contentWindow.axe) {
      const script = frame.contentDocument.createElement('script');
      script.textContent = axe.source;
      frame.contentDocument.head.append(script);
    }
    const result = await frame.contentWindow.axe.run(frame.contentDocument, { runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa']}, resultTypes: ['violations'] });
    const root = frame.contentDocument.documentElement;
    output.textContent = JSON.stringify({viewport:root.clientWidth,scrollWidth:root.scrollWidth,violations: result.violations.map(item => ({id:item.id,impact:item.impact,description:item.description,nodes:item.nodes.map(node => ({target:node.target,html:node.html,summary:node.failureSummary}))})),passes:result.passes.length},null,2);
  } catch(error) { output.textContent = String(error.message); }
});
