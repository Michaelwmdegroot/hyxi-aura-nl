#!/usr/bin/env python3
"""HYXI AURA — standards-based sitemap audit (stdlib, no external deps).

Validate well-formed sitemap XML and browser XSL. On --live, also read actual
public HTTP responses, headers and a Googlebot-*like* User-Agent probe.
A spoofed User-Agent is NOT evidence of what verified Googlebot sees.
Never send credentials, use Search Console APIs or submit live form data.
"""
import argparse
from datetime import date, datetime
from pathlib import Path
import re
import sys
import urllib.error
import urllib.request
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
XSL_NS = "http://www.w3.org/1999/XSL/Transform"
BASE = "https://hyxi-aura.nl"
COUNT = 13
UA_TESTS = {
    "standard-client": "Mozilla/5.0 (compatible; SitemapAudit/1.0; +https://hyxi-aura.nl/)",
    "Googlebot-like-UA-not-verified": "Googlebot/2.1 (+http://www.google.com/bot.html)",
}


def validate_xml(data, label):
    """Reject malformed documents, wrong namespaces, and surprising URL sets."""
    if not data.startswith(b'<?xml version="1.0" encoding="UTF-8"?>'):
        raise ValueError(f"{label}: missing UTF-8 XML declaration")
    root = ET.fromstring(data)
    if root.tag != f"{{{SITEMAP_NS}}}urlset":
        raise ValueError(f"{label}: expected namespaced urlset, got {root.tag}")
    entries = list(root)
    if len(entries) != COUNT:
        raise ValueError(f"{label}: expected {COUNT} URL entries, got {len(entries)}")
    found = []
    for entry in entries:
        if entry.tag != f"{{{SITEMAP_NS}}}url":
            raise ValueError(f"{label}: unexpected entry {entry.tag}")
        locs = entry.findall(f"{{{SITEMAP_NS}}}loc")
        if len(locs) != 1 or not (locs[0].text or "").strip():
            raise ValueError(f"{label}: every URL must have exactly one loc")
        url = (locs[0].text or "").strip()
        parts = urlsplit(url)
        if parts.scheme != "https" or parts.netloc != "hyxi-aura.nl" or not parts.path.endswith("/"):
            raise ValueError(f"{label}: non-canonical URL {url}")
        if parts.query or parts.fragment:
            raise ValueError(f"{label}: query/fragment not allowed {url}")
        for child in entry:
            if child.tag not in (
                f"{{{SITEMAP_NS}}}loc",
                f"{{{SITEMAP_NS}}}lastmod",
            ):
                raise ValueError(f"{label}: unexpected child tag {child.tag}")
            if child.tag.endswith("}lastmod"):
                raw = (child.text or "").strip()
                try:
                    if len(raw) == 10:
                        date.fromisoformat(raw)
                    else:
                        datetime.fromisoformat(raw.replace("Z", "+00:00"))
                except ValueError:
                    raise ValueError(f"{label}: invalid lastmod {raw}")
        found.append(url)
    if len(found) != len(set(found)):
        raise ValueError(f"{label}: duplicate locs")
    if BASE + "/" not in found:
        raise ValueError(f"{label}: missing homepage")
    if BASE + "/datasheet/" not in found:
        raise ValueError(f"{label}: missing manufacturer datasheet page")
    return found


def check_xsl(path):
    root = ET.parse(path).getroot()
    if root.tag not in (f"{{{XSL_NS}}}stylesheet", f"{{{XSL_NS}}}transform"):
        raise ValueError("XSL stylesheet does not contain a valid xsl:stylesheet root")


def inspect_live(label, ua, expected):
    req = urllib.request.Request(
        BASE + "/sitemap.xml",
        headers={
            "User-Agent": ua,
            "Accept": "application/xml,text/xml,*/*",
            "Cache-Control": "no-cache",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=18) as res:
            raw = res.read(1_500_000)
            status = res.status
            content_type = res.headers.get("Content-Type", "")
            content_encoding = res.headers.get("Content-Encoding", "")
            xrobots = res.headers.get("X-Robots-Tag", "")
            cache = res.headers.get("Cache-Control", "")
    except urllib.error.HTTPError as exc:
        raise ValueError(f"{label}: HTTP {exc.code}; look for a host/WAF/bot issue") from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        raise ValueError(f"{label}: could not fetch sitemap ({type(exc).__name__})") from exc
    if status != 200:
        raise ValueError(f"{label}: HTTP status {status}")
    if not re.match(r"(?i)^(application/xml|text/xml)(?:[; ]|$)", content_type):
        raise ValueError(f"{label}: XML sitemap has wrong Content-Type: {content_type!r}")
    if "noindex" in xrobots.lower():
        raise ValueError(f"{label}: X-Robots-Tag unexpectedly contains noindex")
    urls = validate_xml(raw, label)
    if set(urls) != set(expected):
        raise ValueError(f"{label}: live sitemap URLs differ from the checked-in sitemap")
    print(f"PASS {label}: HTTP 200, {len(urls)} canonical URLs, "
          f"Content-Type={content_type}, Content-Encoding={content_encoding or '-'}, "
          f"Cache-Control={cache or '-'}, XML valid")
    return raw


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file", help="Sitemap XML file (e.g. dist/sitemap.xml)")
    parser.add_argument("--xsl", help="Browser stylesheet, e.g. dist/sitemap.xsl")
    parser.add_argument("--live", action="store_true", help="Check live HTTP headers and bot-like UA")
    args = parser.parse_args()
    raw = Path(args.file).read_bytes()
    urls = validate_xml(raw, args.file)
    print(f"PASS local XML: {len(urls)} unique canonical URLs; "
          "correct urlset namespace and UTF-8 document")
    if args.xsl:
        check_xsl(args.xsl)
        if b'<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>' not in raw:
            raise ValueError("Missing XML stylesheet processing instruction")
        print("PASS browser-only XSL: valid XML and linked from sitemap")
    if args.live:
        for label, ua in UA_TESTS.items():
            inspect_live(label, ua, urls)
        print("NOTICE UA spoofing cannot prove real Googlebot accessibility. "
              "For 'Couldn't fetch', inspect details in Google Search Console.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, ET.ParseError, OSError) as err:
        print("FAIL sitemap audit:", str(err), file=sys.stderr)
        sys.exit(1)
