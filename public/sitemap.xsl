<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  exclude-result-prefixes="s">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="nl">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>XML-sitemap | HYXI AURA</title>
        <style>
          :root { color-scheme:light; font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#252b28; background:#f7f8f5; }
          * { box-sizing:border-box; }
          body { margin:0; font-size:15px; line-height:1.65; }
          header { padding:42px 24px 32px; border-bottom:1px solid #dce2dc; background:white; }
          main { max-width:1050px; margin:0 auto; padding:36px 24px 72px; }
          header > div { max-width:1002px; margin:auto; }
          .label { font-size:12px; font-weight:750; text-transform:uppercase; letter-spacing:.12em; color:#856142; }
          h1 { margin:9px 0; font-size:clamp(30px,5vw,44px); line-height:1.15; letter-spacing:-.04em; }
          p { margin:0 0 18px; color:#58645c; }
          .explain { max-width:770px; }
          .summary { display:flex; justify-content:space-between; align-items:baseline; gap:16px; margin-bottom:20px; flex-wrap:wrap; }
          .summary strong { font-size:22px; letter-spacing:-.04em; }
          table { border-collapse:collapse; width:100%; background:#fff; border:1px solid #dce2dc; border-radius:14px; overflow:hidden; }
          thead { background:#f0f3ef; }
          th,td { padding:15px 17px; border-bottom:1px solid #e8ebe7; text-align:left; vertical-align:top; }
          th { font-size:12px; text-transform:uppercase; letter-spacing:.06em; color:#566257; }
          tbody tr:last-child td { border-bottom:0; }
          tbody tr:hover { background:#f9faf7; }
          td:first-child { width:72px; color:#6b766d; font-variant-numeric:tabular-nums; }
          a { color:#25614c; text-underline-offset:3px; overflow-wrap:anywhere; }
          a:hover { color:#173c2f; }
          footer { margin-top:28px; font-size:13px; color:#657269; }
          @media(max-width:550px) { header {padding:26px 18px;} main {padding:24px 16px 50px;} th,td {padding:12px 11px;} td:first-child{width:48px;} }
        </style>
      </head>
      <body>
        <header>
          <div>
            <span class="label">HYXI AURA · Thuisbatterij Team</span>
            <h1>XML-sitemap</h1>
            <p class="explain">Overzicht van de canonieke publieke pagina's op hyxi-aura.nl. Dit is een geldige XML-sitemap voor zoekmachines. De onderstaande tabel is uitsluitend een visuele weergave voor bezoekers.</p>
          </div>
        </header>
        <main>
          <div class="summary">
            <strong><xsl:value-of select="count(s:urlset/s:url)"/> pagina's</strong>
            <a href="/">Terug naar HYXI AURA</a>
          </div>
          <table>
            <thead><tr><th scope="col">Nr.</th><th scope="col">Pagina-URL</th></tr></thead>
            <tbody>
              <xsl:for-each select="s:urlset/s:url">
                <tr>
                  <td><xsl:value-of select="position()"/></td>
                  <td>
                    <a href="{s:loc}"><xsl:value-of select="s:loc"/></a>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
          <footer>XML-standaard: <a href="https://www.sitemaps.org/protocol.html">Sitemaps.org</a>. Zoekmachines lezen de onderliggende XML, niet deze vormgeving. De sitemap geeft geen indexatie- of rankinggarantie.</footer>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
