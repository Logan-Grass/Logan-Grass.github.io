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


class SiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = (ROOT / "index.html").read_text()
        cls.page = Page()
        cls.page.feed(cls.source)

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
        css = (ROOT / "styles.css").read_text()
        rules = re.findall(r"\.js\s+\[data-reveal\]\s*\{([^}]+)\}", css)
        self.assertTrue(rules, "Essential content needs an explicit visible default")
        for rule in rules:
            self.assertNotRegex(rule, r"opacity\s*:\s*0\s*[;}]?")
            self.assertNotRegex(rule, r"visibility\s*:\s*hidden")

    def test_jetbrains_mono_is_the_only_web_font(self):
        css = (ROOT / "styles.css").read_text()
        self.assertNotRegex(self.source + css, r"(?i)space[ +]grotesk")
        self.assertIn("family=JetBrains+Mono:", self.source)
        self.assertRegex(css, r"--sans:\s*var\(--mono\)")

    def test_full_width_header_does_not_use_scrollbar_inclusive_vw(self):
        css = (ROOT / "styles.css").read_text()
        self.assertNotRegex(css, r"calc\(50%\s*-\s*50vw\)")

    def test_pages_custom_domain_preserved(self):
        self.assertEqual((ROOT / "CNAME").read_text().strip(), "logangrass.com")
        self.assertTrue((ROOT / ".nojekyll").exists())


if __name__ == "__main__":
    unittest.main()
