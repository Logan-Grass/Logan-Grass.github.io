"use strict";

// Progressive enhancement only: every section is readable and usable without JavaScript.
// The terminal is a local, static command table. Nothing typed into it is evaluated,
// sent anywhere, or inserted as HTML: output is built with textContent and trusted nodes.

const SITE = Object.freeze({
  location: Object.freeze({ lat: 34.0522, lng: -118.2437, zoom: 11 }),
  repo: "Logan-Grass/Logan-Grass.github.io",
  resume: "assets/logan-grass-resume.pdf?v=71409c6a",
  timeZone: "America/Los_Angeles"
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const scrollBehavior = prefersReducedMotion ? "auto" : "smooth";
const select = (selector, root = document) => root.querySelector(selector);
const selectAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));

// Set by initMap when Leaflet and the map container are available.
let resetMapView = null;

function setCurrentYear() {
  const year = select("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function initContactForm() {
  const form = select("#contact-form");
  if (!form) return;

  const status = select("#form-status", form);
  const submitButton = select('button[type="submit"]', form);
  const honeypot = select('[name="_gotcha"]', form);

  const setStatus = (message, kind = "") => {
    if (!status) return;
    status.textContent = message;
    status.className = `form-status${kind ? ` is-${kind}` : ""}`;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (honeypot?.value || !form.reportValidity()) return;

    submitButton.disabled = true;
    setStatus("Sending…");

    try {
      const response = await fetch(form.action, {
        method: form.method,
        headers: { Accept: "application/json" },
        body: new FormData(form)
      });

      if (!response.ok) throw new Error(`Form relay responded ${response.status}`);
      form.reset();
      setStatus("Message sent. I'll get back to you soon.", "ok");
    } catch {
      setStatus("Something went wrong. Try again in a minute, or reach me on GitHub.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

/* ---------- Terminal ---------- */

const laDate = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZone: SITE.timeZone,
  timeZoneName: "short"
});

function resumeLink() {
  const link = document.createElement("a");
  link.href = SITE.resume;
  link.setAttribute("download", "");
  link.textContent = "logan-grass-resume.pdf";
  return link;
}

// Each command returns an array of lines. A line is a string, or { text, kind },
// or { node } for a trusted element created in this file.
const TERMINAL_COMMANDS = Object.freeze({
  help: () => [
    "navigation   lab  work  history  toolkit  tickets  contact",
    "about me     whoami  role  certs  uptime  resume",
    "this shell   ls  pwd  date  map  clear  help",
    { text: "Commands are matched locally; nothing is executed.", kind: "dim" }
  ],
  whoami: () => ["Logan Grass, systems & infrastructure, Los Angeles"],
  role: () => [
    "MSP Help Desk Engineer, Tier II @ AllSafe IT (Pasadena, since Sep 2026)",
    "Tier II remote and onsite support: workstations, servers, networks, applications."
  ],
  certs: () => [
    "CompTIA Network+   Jan 2026",
    "CompTIA A+         Oct 2024",
    { text: "CompTIA Security+  in progress", kind: "warn" },
    { text: "Certificate PDFs are in ~/contact.", kind: "dim" }
  ],
  uptime: () => [
    "in IT operations since 2021 (5+ years)",
    "help desk → help desk manager → field escalation → embedded support → Tier II"
  ],
  pwd: () => ["/los-angeles/operations"],
  ls: () => [{ text: "lab/  work/  history/  toolkit/  tickets/  contact/  resume.pdf", kind: "dirs" }],
  date: () => [laDate.format(new Date())],
  resume: () => [{ node: resumeLink() }, { text: "PDF download, current revision.", kind: "dim" }],
  lab: () => [
    "Proxmox VE + Debian/Ubuntu LXC, changed through Forgejo → Actions → Ansible",
    "access: Casdoor SSO for people, short-lived OpenBao SSH certificates for automation",
    "signals: Wazuh, Prometheus, Blackbox, Grafana",
    { text: "snapshot from October 2026 runbooks, not live telemetry", kind: "dim" },
    { text: "→ ~/lab", kind: "ok", target: "#lab" }
  ],
  work: () => [
    "LG-OPS-01  router deployments        95% fewer configuration errors",
    "LG-OPS-02  PXE workstation builds    hours → minutes",
    "LG-OPS-03  office buildout           25+ people ready on day one",
    { text: "→ ~/work", kind: "ok", target: "#work" }
  ],
  history: () => [
    "2026–now   AllSafe IT          MSP Help Desk Engineer, Tier II",
    "2026       ApexIT Consulting   Service Delivery Specialist",
    "2021–2026  911 IT              Technician → Manager → Field Specialist II",
    { text: "→ ~/history", kind: "ok", target: "#experience" }
  ],
  toolkit: () => [
    "M365 / Entra ID / Active Directory / Windows Server / Intune",
    "ConnectWise / Autotask / IT Glue / MikroTik / UniFi / FortiGate / Veeam",
    { text: "→ ~/toolkit", kind: "ok", target: "#stack" }
  ],
  tickets: () => [
    "\"He came up with a solution that should be a permanent fix.\"",
    { text: "→ ~/tickets", kind: "ok", target: "#feedback" }
  ],
  contact: () => [
    "form: ~/contact   github: github.com/Logan-Grass",
    { text: "→ ~/contact", kind: "ok", target: "#contact" }
  ],
  map: () => {
    if (!resetMapView) {
      return [{ text: "map unavailable: the tile library did not load. An OpenStreetMap link is shown instead.", kind: "warn" }];
    }
    resetMapView();
    return [{ text: "map reset to Los Angeles city centre", kind: "ok" }];
  },
  clear: () => null
});

const TERMINAL_ALIASES = Object.freeze({
  "?": "help",
  "man": "help",
  "about": "whoami",
  "id": "whoami",
  "role.txt": "role",
  "job": "role",
  "certifications": "certs",
  "stack": "toolkit",
  "tools": "toolkit",
  "experience": "history",
  "feedback": "tickets",
  "cases": "work",
  "resume.pdf": "resume",
  "cv": "resume",
  "cls": "clear",
  "dir": "ls",
  "time": "date",
  "~": "pwd",
  "cd": "pwd",
  "home": "pwd"
});

// "cd lab/", "cat role.txt", "./work" and "LAB" all resolve to a command name.
function resolveCommand(raw) {
  let name = raw.trim().toLowerCase().replace(/\s+/g, " ");
  name = name.replace(/^(?:cd|cat|open|less|more|ls)\s+/, "").replace(/^~?\.?\//, "").replace(/\/+$/, "");
  if (Object.hasOwn(TERMINAL_ALIASES, name)) name = TERMINAL_ALIASES[name];
  return Object.hasOwn(TERMINAL_COMMANDS, name) ? name : null;
}

function initTerminal() {
  const form = select("#terminal-form");
  const input = select("#terminal-input");
  const log = select("#terminal-history");
  if (!form || !input || !log) return;

  const MAX_LINES = 160;
  const recall = [];
  let recallIndex = 0;

  const appendLine = (content, kind = "") => {
    const line = document.createElement("p");
    line.className = `t-line${kind ? ` t-${kind}` : ""}`;
    if (content instanceof Node) line.append(content);
    else line.textContent = content;
    log.append(line);
  };

  const appendCommand = (command) => {
    const line = document.createElement("p");
    line.className = "t-line t-cmd";
    const ps1 = document.createElement("span");
    ps1.className = "t-ps1";
    ps1.textContent = "logan@la:~$";
    line.append(ps1, ` ${command}`);
    log.append(line);
  };

  const trim = () => {
    while (log.childElementCount > MAX_LINES) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  };

  // Moves focus to a section that a navigation command scrolled to. Used only for
  // shortcut buttons, so keyboard users are not left on a control that is now off-screen;
  // typed commands keep focus in the input.
  const focusSection = (section) => {
    if (!section.hasAttribute("tabindex")) section.setAttribute("tabindex", "-1");
    section.focus({ preventScroll: true });
  };

  // Single entry point for typed commands and shortcut buttons.
  const run = (raw, { fromShortcut = false } = {}) => {
    const command = String(raw).trim().slice(0, 64);
    if (!command) return;

    recall.push(command);
    if (recall.length > 30) recall.shift();
    recallIndex = recall.length;

    const name = resolveCommand(command);
    if (name === "clear") {
      log.replaceChildren();
      return;
    }

    appendCommand(command);

    if (!name) {
      const first = command.split(" ")[0].toLowerCase();
      const message = first === "sudo" || first === "su"
        ? "permission denied: this is a portfolio, not a production host"
        : `command not found: ${command}. Try: help`;
      appendLine(message, "warn");
      trim();
      return;
    }

    let target = null;
    (TERMINAL_COMMANDS[name]() || []).forEach((entry) => {
      if (typeof entry === "string") appendLine(entry);
      else if (entry.node) appendLine(entry.node, entry.kind);
      else {
        appendLine(entry.text, entry.kind);
        if (entry.target) target = entry.target;
      }
    });
    trim();

    const section = target ? select(target) : null;
    if (!section) return;
    section.scrollIntoView({ behavior: scrollBehavior, block: "start" });
    if (fromShortcut) focusSection(section);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value;
    input.value = "";
    run(value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    if (!recall.length) return;
    event.preventDefault();
    recallIndex = event.key === "ArrowUp"
      ? Math.max(0, recallIndex - 1)
      : Math.min(recall.length, recallIndex + 1);
    input.value = recall[recallIndex] ?? "";
  });

  // Shortcut buttons pass a fixed command name from markup through the same handler.
  const shortcuts = select(".terminal-shortcuts");
  if (shortcuts) {
    selectAll("[data-terminal-run]", shortcuts).forEach((button) => {
      button.addEventListener("click", () => run(button.dataset.terminalRun, { fromShortcut: true }));
    });
    shortcuts.hidden = false;
  }

  selectAll(".js-only", log).forEach((node) => { node.hidden = false; });
  form.hidden = false;
  log.scrollTop = log.scrollHeight;
}

/* ---------- Map ---------- */

function initMap() {
  const container = select("#la-map");
  if (!container) return;

  const fallback = select(".map-fallback", container);
  const leaflet = window.L;
  if (!leaflet || typeof leaflet.map !== "function") {
    // CDN blocked or offline: keep the OpenStreetMap link visible.
    container.classList.add("is-offline");
    return;
  }

  const { lat, lng, zoom } = SITE.location;
  let map;
  try {
    map = leaflet.map(container, {
      center: [lat, lng],
      zoom,
      minZoom: 8,
      maxZoom: 16,
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: !leaflet.Browser.mobile,
      tap: false,
      attributionControl: true
    });
  } catch {
    container.classList.add("is-offline");
    return;
  }

  map.attributionControl.setPrefix(false);
  const tiles = leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  });
  tiles.once("tileload", () => {
    fallback?.setAttribute("hidden", "");
    container.classList.add("is-live");
  });
  tiles.addTo(map);

  leaflet.marker([lat, lng], {
    icon: leaflet.divIcon({ className: "map-marker", iconSize: [14, 14] }),
    keyboard: false,
    interactive: false
  }).addTo(map);

  resetMapView = () => {
    map.flyTo([lat, lng], zoom, { animate: !prefersReducedMotion, duration: 0.6 });
  };

  selectAll("[data-map-reset]").forEach((button) => {
    button.hidden = false;
    button.addEventListener("click", resetMapView);
  });
}

/* ---------- Lab architecture tabs ---------- */

/* WAI-ARIA tabs with automatic activation: arrow keys move focus and selection;
   Home/End jump to the ends. Without JS, all three paths render stacked and the
   tablist stays hidden. */
function initArchitectureTabs() {
  const figure = select(".architecture");
  const tablist = select('[role="tablist"]', figure || document);
  if (!figure || !tablist) return;

  const tabs = selectAll('[role="tab"]', tablist);
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls"))).filter(Boolean);
  if (tabs.length !== panels.length || !tabs.length) return;

  const activate = (index, { focus = false } = {}) => {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
    if (focus) tabs[index].focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(index));
    tab.addEventListener("keydown", (event) => {
      const last = tabs.length - 1;
      const keyTargets = {
        ArrowRight: index === last ? 0 : index + 1,
        ArrowLeft: index === 0 ? last : index - 1,
        Home: 0,
        End: last
      };
      if (!(event.key in keyTargets)) return;
      event.preventDefault();
      activate(keyTargets[event.key], { focus: true });
    });
  });

  panels.forEach((panel, i) => {
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tabs[i].id);
    panel.tabIndex = 0;
  });
  figure.classList.add("has-tabs");
  tablist.hidden = false;
  activate(0);
}

/* Print and in-page links should reach collapsed case studies. */
function initCaseStudies() {
  const cases = selectAll("details.case");
  if (!cases.length) return;

  let openedForPrint = [];
  window.addEventListener("beforeprint", () => {
    openedForPrint = cases.filter((item) => !item.open);
    openedForPrint.forEach((item) => { item.open = true; });
  });
  window.addEventListener("afterprint", () => {
    openedForPrint.forEach((item) => { item.open = false; });
    openedForPrint = [];
  });

  // Opening a case via an in-page link (e.g. #office-buildout) expands it.
  const openFromHash = () => {
    let id;
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return; // Malformed external fragments must not prevent other enhancements.
    }
    const target = id ? document.getElementById(id) : null;
    if (target instanceof HTMLDetailsElement) target.open = true;
  };
  window.addEventListener("hashchange", openFromHash);
  openFromHash();
}

/* ---------- Ticket feedback filter + show more ---------- */

/* Without JS every response is visible. With JS, the first FEEDBACK_LIMIT matching
   responses show by default and a native button reveals the rest. Filters work across
   all responses; changing the filter returns to the collapsed view. Print CSS shows
   every response regardless of filter or collapse state. */
const FEEDBACK_LIMIT = 6;

function initFeedback() {
  const tools = select(".feedback-tools");
  const items = selectAll(".ticket[data-feedback-category]");
  const buttons = selectAll("[data-feedback-filter]");
  const count = select("#feedback-count");
  const more = select(".feedback-more");
  const toggle = select(".feedback-toggle");
  const toggleLabel = select(".feedback-toggle-label");
  if (!tools || !items.length || !buttons.length || !count) return;

  let filter = "all";
  let expanded = false;

  const render = () => {
    const matching = items.filter((item) => filter === "all" || item.dataset.feedbackCategory === filter);
    const canCollapse = matching.length > FEEDBACK_LIMIT;
    const capped = canCollapse && !expanded;

    items.forEach((item) => { item.hidden = true; });
    matching.forEach((item, index) => { item.hidden = capped && index >= FEEDBACK_LIMIT; });

    const visible = capped ? FEEDBACK_LIMIT : matching.length;
    count.textContent = filter === "all"
      ? `${visible} of ${items.length} shown`
      : `${visible} of ${items.length} shown, filtered to ${filter}`;

    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.feedbackFilter === filter));
    });

    if (more && toggle && toggleLabel) {
      more.hidden = !canCollapse;
      toggle.setAttribute("aria-expanded", String(canCollapse && expanded));
      toggleLabel.textContent = expanded ? "Show fewer" : `Show all ${matching.length}`;
    }
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      filter = button.dataset.feedbackFilter;
      expanded = false;
      render();
    });
  });

  toggle?.addEventListener("click", () => {
    expanded = !expanded;
    render();
    // Focus stays on the toggle. After collapsing, the button moves up with the shorter
    // grid; bring it back into view with the smallest possible scroll.
    if (!expanded) {
      const rect = toggle.getBoundingClientRect();
      const headerBottom = select(".site-header")?.getBoundingClientRect().bottom ?? 0;
      if (rect.top < headerBottom || rect.bottom > window.innerHeight) {
        toggle.scrollIntoView({ behavior: "auto", block: "nearest" });
      }
    }
  });

  tools.hidden = false;
  render();
}

/* ---------- Page chrome ---------- */

function initReveal() {
  const nodes = selectAll("[data-reveal]");
  if (!nodes.length) return;

  const revealImmediately = prefersReducedMotion
    || !("IntersectionObserver" in window)
    || window.matchMedia("(max-width: 760px)").matches;

  if (revealImmediately) {
    nodes.forEach((node) => node.classList.add("revealed"));
    return;
  }

  document.documentElement.classList.add("js");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("revealed");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });

  nodes.forEach((node) => observer.observe(node));
}

function initHeader() {
  const header = select(".site-header");
  if (!header) return;

  let framePending = false;
  const update = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    framePending = false;
  };

  window.addEventListener("scroll", () => {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(update);
  }, { passive: true });

  update();
}

function initClock() {
  const clock = select("#local-time");
  if (!clock) return;

  const format = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: SITE.timeZone
  });

  const tick = () => {
    clock.textContent = `${format.format(new Date())} PT`;
  };

  tick();
  window.setInterval(tick, 15_000);
}

async function loadLatestCommit() {
  const sha = select("#commit-sha");
  const link = select("#commit-link");
  if (!sha || !link) return;

  try {
    const response = await fetch(`https://api.github.com/repos/${SITE.repo}/commits?per_page=1`, {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!response.ok) throw new Error(`GitHub responded ${response.status}`);

    const [commit] = await response.json();
    if (typeof commit?.sha !== "string") throw new Error("No commit returned");

    sha.textContent = commit.sha.slice(0, 7);
    if (typeof commit.html_url === "string" && commit.html_url.startsWith("https://github.com/")) {
      link.href = commit.html_url;
    }
    link.title = commit.commit?.message?.split("\n")[0] || "Latest public commit";
  } catch {
    sha.textContent = "github";
  }
}

function initSectionNavigation() {
  const links = selectAll(".nav-links a");
  const sections = links
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter(Boolean);

  if (!sections.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    const current = entries.find((entry) => entry.isIntersecting);
    if (!current) return;

    links.forEach((link) => {
      const active = link.hash === `#${current.target.id}`;
      link.classList.toggle("is-current", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-38% 0px -56% 0px" });

  sections.forEach((section) => observer.observe(section));
}

function initPage() {
  const steps = [
    setCurrentYear,
    initReveal,
    initHeader,
    initMap,
    initTerminal,
    initArchitectureTabs,
    initCaseStudies,
    initFeedback,
    initContactForm,
    initClock,
    initSectionNavigation
  ];
  // One failing enhancement (for example a blocked CDN) must not stop the others.
  steps.forEach((step) => {
    try {
      step();
    } catch (error) {
      console.error(error);
    }
  });
  loadLatestCommit();
}

initPage();
