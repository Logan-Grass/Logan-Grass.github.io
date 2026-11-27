"""Dependency-free checks for the public, build-free GitHub Pages site.

Run from the repository root: python3 -m unittest discover -s tests -v
"""
from html.parser import HTMLParser
from pathlib import Path
import re
import unittest
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.elements = []
        self.ids = []
        self.refs = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if "id" in attrs:
            self.ids.append(attrs["id"])
        for name in ("href", "src"):
            if attrs.get(name):
                self.refs.append(attrs[name])


class Node:
    def __init__(self, tag, attrs, parent):
        self.tag = tag
        self.classes = (dict(attrs).get("class") or "").split()
        self.parent = parent
        self.children = []


class ElementTree(HTMLParser):
    """Minimal parent/child tree, enough to check where an element sits."""

    VOID = frozenset({"meta", "link", "img", "input", "br", "hr", "source", "area", "base", "col", "wbr"})

    def __init__(self):
        super().__init__()
        self.nodes = []
        self.open = []

    def handle_starttag(self, tag, attrs):
        parent = self.open[-1] if self.open else None
        node = Node(tag, attrs, parent)
        if parent is not None:
            parent.children.append(node)
        self.nodes.append(node)
        if tag not in self.VOID:
            self.open.append(node)

    def handle_endtag(self, tag):
        while self.open and self.open[-1].tag != tag:
            self.open.pop()
        if self.open:
            self.open.pop()


class SiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = (ROOT / "index.html").read_text()
        cls.page = Page()
        cls.page.feed(cls.source)
        # The long technical write-up lives on its own page; the main page stays short.
        cls.details = (ROOT / "details.html").read_text()
        cls.details_page = Page()
        cls.details_page.feed(cls.details)

    def test_unique_ids(self):
        self.assertEqual(len(self.page.ids), len(set(self.page.ids)))

    def test_local_links_and_assets_exist(self):
        for ref in self.page.refs:
            with self.subTest(ref=ref):
                url = urlsplit(ref)
                if url.scheme or url.netloc:
                    continue
                if url.path:
                    self.assertTrue((ROOT / unquote(url.path).lstrip("/")).is_file())
                elif url.fragment:
                    self.assertIn(unquote(url.fragment), self.page.ids)

    def test_document_structure(self):
        tags = [tag for tag, _ in self.page.elements]
        self.assertEqual(tags.count("h1"), 1)
        self.assertEqual(tags.count("main"), 1)
        self.assertTrue(any(tag == "html" and attrs.get("lang") == "en"
                            for tag, attrs in self.page.elements))
        self.assertTrue(any(tag == "meta" and attrs.get("name") == "viewport"
                            for tag, attrs in self.page.elements))

    def test_contact_endpoint_preserved(self):
        self.assertTrue(any(tag == "form" and attrs.get("method", "").lower() == "post"
                            and attrs.get("action") == "https://formspree.io/f/mdaqdreg"
                            for tag, attrs in self.page.elements))

    def test_no_private_infrastructure_details(self):
        for text in (self.details,):
            self.assertNotRegex(text, r"\b(?:192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)\b")
            self.assertNotRegex(text, r"(?i)\bCT\d{3,4}\b|[a-z0-9-]+\.oggie\.casa")
        self.assertNotRegex(self.source, r"\b(?:192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)\b")
        self.assertNotRegex(self.source, r"(?i)\bCT\d{3,4}\b|[a-z0-9-]+\.oggie\.casa")

    def test_public_evidence_contains_no_private_details(self):
        files = sorted((ROOT / "assets/evidence").glob("*.md"))
        self.assertEqual(len(files), 2)
        for path in files:
            with self.subTest(path=path.name):
                content = path.read_text()
                self.assertNotRegex(content, r"\b(?:192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)\b")
                self.assertNotRegex(content, r"(?i)\bCT\d{3,4}\b|[a-z0-9-]+\.oggie\.casa|BEGIN .*PRIVATE KEY")
                self.assertIn("6df1c56", content)
                self.assertIn("excerpt", content)

    def test_no_fake_live_health(self):
        self.assertNotIn("all services nominal", self.source.lower())
        self.assertNotIn("restore paths stay exercised", self.source.lower())
        self.assertNotIn("20+ services running 24/7", self.source.lower())

    def test_interactive_map_has_no_script_fallback(self):
        self.assertTrue(any(tag == "a" and "openstreetmap.org/" in attrs.get("href", "")
                            for tag, attrs in self.page.elements))
        self.assertIn("Los Angeles", self.source)

    def test_terminal_is_preserved(self):
        self.assertTrue(any(tag == "input" and "terminal" in attrs.get("id", "")
                            for tag, attrs in self.page.elements))
        script = (ROOT / "script.js").read_text()
        self.assertNotRegex(script, r"\beval\s*\(|\bnew\s+Function\s*\(")
        self.assertNotIn("getCurrentPosition", script)

    def test_essential_content_is_not_hidden_before_scroll(self):
        # Content renders immediately; there is no scroll-reveal step to wait for.
        css = (ROOT / "styles.css").read_text()
        script = (ROOT / "script.js").read_text()
        self.assertNotIn("data-reveal", self.source)
        self.assertNotIn("data-reveal", css)
        self.assertNotIn("initReveal", script)

    def test_avoids_generic_template_patterns(self):
        # Regressions to the stock AI-portfolio scaffold the redesign removed:
        # eyebrow labels and section numbers above headings, fake window-control
        # dots, decorative glass blur, and one-sided accent bars.
        css = (ROOT / "styles.css").read_text()
        for token in ('class="eyebrow', 'class="kicker', "panel-dots", "eyebrow-n"):
            with self.subTest(token=token):
                self.assertNotIn(token, self.source)
        self.assertNotRegex(css, r"backdrop-filter\s*:\s*blur")
        self.assertNotRegex(css, r"border-left\s*:\s*[2-9]px\s+solid")

    def test_not_found_page(self):
        page = (ROOT / "404.html").read_text()
        self.assertIn('href="/"', page)
        self.assertNotRegex(page, r"\binnerHTML\b|\beval\s*\(")

    def test_jetbrains_mono_is_the_only_font(self):
        # Owner preference (confirmed 2026-11-26): JetBrains Mono for all text, self-hosted,
        # no second typeface and no third-party font CDN. Readability comes from size,
        # line-height and contrast.
        css = (ROOT / "styles.css").read_text()
        pages = self.source + (ROOT / "404.html").read_text()
        og = (ROOT / "assets/og-card.svg").read_text()
        self.assertNotRegex(pages + css, r"fonts\.(googleapis|gstatic)\.com")
        self.assertNotRegex(pages + css + og, r"(?i)space[ +]grotesk|ibm plex|\binter\b|roboto|system-ui|sans-serif")
        self.assertEqual(set(re.findall(r'font-family:\s*"([^"]+)"', css)), {"JetBrains Mono"})
        self.assertRegex(css, r'--mono:\s*"JetBrains Mono"')
        self.assertRegex(css, r"--sans:\s*var\(--mono\)")
        self.assertEqual(set(re.findall(r'font-family="([^",]+)', og)), {"JetBrains Mono"})
        fonts = re.findall(r'url\("(assets/fonts/[^"?]+\.woff2)(?:\?[^"]*)?"\)', css)
        self.assertEqual(len(fonts), 2)
        for name in fonts:
            with self.subTest(font=name):
                self.assertTrue(name.startswith("assets/fonts/jetbrains-mono-"))
                self.assertTrue((ROOT / name).is_file())
        self.assertEqual(sorted(p.name for p in (ROOT / "assets/fonts").iterdir()),
                         ["OFL-JetBrains-Mono.txt", "jetbrains-mono-latin-400-normal.woff2",
                          "jetbrains-mono-latin-600-normal.woff2"])
        body_match = re.search(r"body\s*\{([^}]+)\}", css)
        self.assertIsNotNone(body_match)
        self.assertRegex(body_match.group(1) if body_match else "", r"font-size:\s*1\.0625rem")

    def test_identity_provider_is_current(self):
        # Casdoor was retired in November 2026; Authelia is the identity provider.
        script = (ROOT / "script.js").read_text()
        self.assertNotIn("Casdoor", self.source + self.details + script)
        self.assertIn("Authelia", self.details)

    def test_every_svg_is_titled_or_hidden(self):
        # Diagrams are informative images: each needs a <title> and <desc> wired up
        # through aria-labelledby. Decorative icons must be hidden from assistive tech.
        svgs = re.findall(r"<svg\b[^>]*>.*?</svg>", self.source + self.details, flags=re.S)
        self.assertGreaterEqual(len([s for s in svgs if 'role="img"' in s]), 6)
        for svg in svgs:
            with self.subTest(svg=svg[:80]):
                if 'aria-hidden="true"' in svg.split(">", 1)[0]:
                    continue
                self.assertIn('role="img"', svg.split(">", 1)[0])
                title = re.search(r'<title id="([^"]+)">[^<]+</title>', svg)
                desc = re.search(r'<desc id="([^"]+)">[^<]+</desc>', svg)
                self.assertTrue(title and desc)
                if title and desc:
                    self.assertIn(f'aria-labelledby="{title.group(1)} {desc.group(1)}"', svg)
                self.assertNotRegex(svg, r"#[0-9a-fA-F]{3,6}\b")

    def test_illustrations_are_small_sized_and_described(self):
        # Wordless line drawings (WebP, one palette). Each <img> declares its size so the
        # layout does not jump, is lazy-loaded unless it is the hero image, and carries
        # alt text (empty when the drawing only decorates adjacent text).
        pages = {"index.html": self.source, "details.html": self.details,
                 "404.html": (ROOT / "404.html").read_text()}
        seen = set()
        for name, source in pages.items():
            page = Page()
            page.feed(source)
            images = [attrs for tag, attrs in page.elements if tag == "img"]
            for attrs in images:
                with self.subTest(page=name, src=attrs.get("src")):
                    self.assertIn("alt", attrs)
                    self.assertRegex(attrs.get("width", ""), r"^\d+$")
                    self.assertRegex(attrs.get("height", ""), r"^\d+$")
                    if name == "404.html":
                        self.assertNotEqual(attrs.get("loading"), "lazy")
                    else:
                        self.assertEqual(attrs.get("loading"), "lazy")
                    self.assertNotRegex(attrs["alt"], r"(?i)\b\d{1,3}(?:\.\d{1,3}){3}\b|\bCT\d{3,4}\b|oggie")
                    files = [attrs["src"]] + re.findall(r"(\S+)\s+\d+w", attrs.get("srcset", ""))
                    for ref in files:
                        path = ROOT / unquote(urlsplit(ref).path).lstrip("/")
                        seen.add(path.name)
                        self.assertTrue(path.is_file(), ref)
                        data = path.read_bytes()
                        self.assertEqual((data[:4], data[8:12]), (b"RIFF", b"WEBP"))
                        self.assertLess(len(data), 150 * 1024)
            if name == "index.html":
                # One picture per scene, each beside its text.
                self.assertEqual(len(images), 6)
        # No unused or non-WebP files hide in assets/img; the one SVG is the CSS background.
        self.assertEqual({p.name for p in (ROOT / "assets/img").iterdir()} - {"contours.svg"}, seen)

    def test_details_page_title_and_top_anchor(self):
        title = re.search(r"<title>(.*?)</title>", self.details, flags=re.S)
        self.assertIsNotNone(title)
        self.assertIn("technical detail", (title.group(1) if title else "").lower())
        self.assertNotIn("long version", self.details.lower())
        self.assertIn("top", self.details_page.ids)  # footer "back to top" target

    def test_every_internal_link_resolves_to_an_id(self):
        ids = {"index.html": set(self.page.ids), "details.html": set(self.details_page.ids)}
        for name, page in (("index.html", self.page), ("details.html", self.details_page)):
            for ref in page.refs:
                target, _, fragment = ref.partition("#")
                if not fragment or ref.startswith(("http:", "https:")):
                    continue
                self.assertIn(target or name, ids, f"{name}: {ref} points at an unknown page")
                self.assertIn(fragment, ids[target or name], f"{name}: {ref} has no matching id")

    def test_back_links_end_their_section(self):
        # Each "back to the main page" row must be the last child of its section body,
        # not stuck inside a nested grid or ahead of later content.
        walker = ElementTree()
        walker.feed(self.details)
        rows = [node for node in walker.nodes if "back-row" in node.classes]
        self.assertGreaterEqual(len(rows), 5)
        for row in rows:
            parent = row.parent
            self.assertIsNotNone(parent)
            if parent is None:
                continue
            self.assertIn("section-body", parent.classes, f"back row sits in <{parent.tag}>")
            self.assertIs(parent.children[-1], row, "back row must be last in its section body")

    def test_hero_fills_the_first_screen(self):
        css = (ROOT / "styles.css").read_text()
        hero = re.search(r"\n\.hero \{(.*?)\n\}", css, flags=re.S)
        self.assertIsNotNone(hero)
        block = hero.group(1) if hero else ""
        self.assertIn("100vh - var(--header-h)", block)  # fallback
        self.assertIn("100svh - var(--header-h)", block)
        self.assertIn("--header-h", css.split(".hero {")[0])
        self.assertIn('href="#agents"', self.source)  # the cue below the hero

    def test_hero_background_is_a_faint_contour_file_not_a_grid(self):
        css = (ROOT / "styles.css").read_text()
        svg = (ROOT / "assets" / "img" / "contours.svg").read_text()
        self.assertIn("contours.svg", css)
        self.assertLess(len(svg.encode()), 60_000)
        self.assertNotIn("<text", svg)
        self.assertNotIn("<pattern", svg)  # contours only, never a grid pattern
        opacity = re.search(r"main::before \{.*?opacity: ([0-9.]+);", css, flags=re.S)
        self.assertIsNotNone(opacity)
        self.assertLessEqual(float(opacity.group(1)) if opacity else 1, 0.15)

    def test_favicon_is_a_shape_not_text_and_linked_everywhere(self):
        svg = (ROOT / "favicon.svg").read_text()
        # Text would depend on an installed font; a tab icon must not.
        self.assertNotIn("<text", svg)
        ico = (ROOT / "favicon.ico").read_bytes()
        self.assertEqual(ico[:4], b"\x00\x00\x01\x00")
        apple = (ROOT / "apple-touch-icon.png").read_bytes()
        self.assertEqual(apple[:8], b"\x89PNG\r\n\x1a\n")
        for name in ("index.html", "details.html", "404.html"):
            html = (ROOT / name).read_text()
            for target in ("favicon.svg", "favicon.ico", "apple-touch-icon.png"):
                self.assertIn(target, html, f"{name} should link {target}")

    def test_main_page_stays_short(self):
        # Owner, 2026-11-27: "way too much text and technical ... less is more".
        text = re.sub(r"<script.*?</script>|<style.*?</style>|<svg.*?</svg>", "",
                      self.source, flags=re.S)
        body = re.sub(r"<[^>]+>", " ", text.split("<body", 1)[1])
        self.assertLess(len(body.split()), 1000)
        # Technical depth moved to the details page, which the main page links to.
        self.assertIn("details.html", self.source)
        self.assertNotIn('id="stack"', self.source)
        self.assertNotIn("quotes-more", self.source)

    def test_history_dates_sit_in_the_left_column(self):
        rows = re.findall(r'<li class="role[^"]*">\s*<time\b', self.source)
        self.assertEqual(len(rows), self.source.count('<li class="role'))
        self.assertGreaterEqual(len(rows), 6)

    def test_agent_story_leads_and_terminal_script_is_plain_text(self):
        self.assertLess(self.source.index('id="agents"'), self.source.index('id="lab"'))
        script_lines = re.findall(r'<p class="[^"]*t-script[^"]*"[^>]*>', self.source)
        self.assertGreaterEqual(len(script_lines), 4)
        for tag in script_lines:  # visible without JavaScript
            self.assertNotIn("hidden", tag)
        js = (ROOT / "script.js").read_text()
        self.assertIn("prefersReducedMotion", js[js.index("function initScriptedExchange"):js.index("function initTerminal")])
        self.assertNotRegex(js, r"\bfetch\([^)]*(openai|anthropic|ollama|api/generate)")

    def test_agent_copy_avoids_ai_startup_cliches(self):
        text = (self.source + self.details).lower()
        for phrase in ("revolutioniz", "supercharge", "unleash", "next-gen", "cutting-edge", "game-chang"):
            self.assertNotIn(phrase, text)
        css = (ROOT / "styles.css").read_text()
        self.assertNotRegex(css, r"(?i)linear-gradient\([^)]*(?:#8|#6|#7)[0-9a-f]{5}[^)]*(?:#0|#3|#4)[0-9a-f]{5}")
        self.assertNotRegex(css, r"box-shadow:[^;]*0 0 \d{2,}px\s+(?!0)")

    def test_short_pages_fill_the_viewport_with_the_background(self):
        # The 404 page is short; the page background must still cover the whole window.
        css = (ROOT / "styles.css").read_text()
        body = re.search(r"\nbody\s*\{([^}]+)\}", css)
        self.assertIsNotNone(body)
        self.assertRegex(body.group(1) if body else "", r"min-height:\s*100d?vh")

    def test_current_role_and_private_job_details(self):
        # Promoted to Project Manager on 2026-11-18. Offer-letter details stay private.
        script = (ROOT / "script.js").read_text()
        self.assertIn("Project Manager", self.source)
        self.assertIn('"jobTitle": "Project Manager"', self.source)
        self.assertIn("Nov 2026", self.source)
        text = self.source + self.details + script
        self.assertNotRegex(text, r"(?i)\$\s?\d|\b(salary|hourly|bonus|401k|PTO|benefits)\b")
        self.assertNotRegex(text, r"(?i)\bLCPs?\b|centralized services|AI initiative|75\s?%")

    def test_no_runbook_mentions(self):
        # Owner: the page does not need runbooks.
        script = (ROOT / "script.js").read_text()
        self.assertNotRegex(self.source + script, r"(?i)runbook")

    def test_full_width_header_does_not_use_scrollbar_inclusive_vw(self):
        css = (ROOT / "styles.css").read_text()
        self.assertNotRegex(css, r"calc\(50%\s*-\s*50vw\)")

    def test_pages_custom_domain_preserved(self):
        self.assertEqual((ROOT / "CNAME").read_text().strip(), "logangrass.com")
        self.assertTrue((ROOT / ".nojekyll").exists())


if __name__ == "__main__":
    unittest.main()
