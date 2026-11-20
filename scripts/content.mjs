import { readFile, writeFile } from 'node:fs/promises';
import { faqs } from '../src/product-data.mjs';
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const faqMarkup = faqs.map(faq => `<details><summary>${escape(faq.question)}</summary><p>${escape(faq.answer)}</p>${faq.sourceUrl ? `<a class="faq-source" href="${escape(faq.sourceUrl)}" target="_blank" rel="noopener">${escape(faq.sourceLabel)}</a>` : ''}</details>`).join('\n');
const structured = {
  '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', '@id': 'https://hyxi-aura.nl/#organization', name: 'NIVO Groep Holland B.V.', url: 'https://nivogroepholland.nl/', address: { '@type': 'PostalAddress', streetAddress: 'Lireweg 52', postalCode: '2153 PH', addressLocality: 'Nieuw-Vennep', addressCountry: 'NL' }, contactPoint: { '@type': 'ContactPoint', contactType: 'Advies via Thuisbatterij Team', telephone: '+31858000563', email: 'info@thuisbatterijteam.nl', availableLanguage: 'Dutch' } },
    { '@type': 'WebSite', '@id': 'https://hyxi-aura.nl/#website', url: 'https://hyxi-aura.nl/', name: 'HYXI AURA · Thuisbatterij Team', inLanguage: 'nl-NL', publisher: { '@id': 'https://hyxi-aura.nl/#organization' } },
    { '@type': 'WebPage', '@id': 'https://hyxi-aura.nl/#webpage', url: 'https://hyxi-aura.nl/', name: 'HYXI AURA thuisbatterij | Capaciteit & advies | Thuisbatterij Team', inLanguage: 'nl-NL', isPartOf: { '@id': 'https://hyxi-aura.nl/#website' }, about: { '@type': 'Thing', name: 'HYXI AURA thuisbatterijsysteem', sameAs: 'https://www.hyxipower.com/nl/ProductsDetail/hyxi-aura' }, publisher: { '@id': 'https://hyxi-aura.nl/#organization' } },
    { '@type': 'FAQPage', '@id': 'https://hyxi-aura.nl/#vragen', mainEntity: faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) },
  ],
};
let html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
html = html.replace(/<!-- FAQ_START -->[\s\S]*?<!-- FAQ_END -->/, `<!-- FAQ_START -->\n${faqMarkup}\n<!-- FAQ_END -->`);
html = html.replace(/<!-- STRUCTURED_DATA_START -->[\s\S]*?<!-- STRUCTURED_DATA_END -->/, `<!-- STRUCTURED_DATA_START -->\n<script type="application/ld+json">${JSON.stringify(structured).replaceAll('<', '\\u003c')}</script>\n<!-- STRUCTURED_DATA_END -->`);
await writeFile(new URL('../index.html', import.meta.url), html);
console.log('Rendered source-backed FAQ and matching structured data into static HTML.');
