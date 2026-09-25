"use strict";

const SITE = Object.freeze({
  location: { lat: 34.0522, lng: -118.2437, zoom: 11 },
  repo: "Logan-Grass/Logan-Grass.github.io",
  timeZone: "America/Los_Angeles"
});

const TERMINAL_INTRO = [
  ["whoami", "Logan Grass | systems & infrastructure"],
  ["pwd", "/los-angeles/operations"],
  ["uptime", "5+ years | MSP -> onsite operations"],
  ["ls", "work  history  toolkit  lab  tickets  contact"]
];

const TERMINAL_COMMANDS = Object.freeze({
  help: { output: "about | work | history | toolkit | lab | tickets | contact | clear" },
  clear: { action: "clear" },
  about: { output: "Logan Grass | systems & infrastructure | Los Angeles, CA" },
  whoami: { output: "Logan Grass" },
  pwd: { output: "/los-angeles/operations" },
  uptime: { output: "5+ years in production | status: available for the next hard problem", kind: "ok" },
  ls: { output: "work  history  toolkit  lab  tickets  contact" },
  work: { output: "opening selected work...", target: "#work", kind: "ok" },
  history: { output: "opening work history...", target: "#experience", kind: "ok" },
  toolkit: { output: "opening working toolkit...", target: "#stack", kind: "ok" },
  stack: { output: "opening working toolkit...", target: "#stack", kind: "ok" },
  lab: { output: "opening home operations lab...", target: "#lab", kind: "ok" },
  tickets: { output: "opening resolved-ticket feedback...", target: "#feedback", kind: "ok" },
  feedback: { output: "opening resolved-ticket feedback...", target: "#feedback", kind: "ok" },
  contact: { output: "opening contact channel...", target: "#contact", kind: "ok" }
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const select = (selector, root = document) => root.querySelector(selector);
const selectAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const scrollBehavior = prefersReducedMotion ? "auto" : "smooth";

function setCurrentYear() {
  const year = select("#year");
  if (year) year.textContent = new Date().getFullYear();
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
    setStatus("sending...");

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
      setStatus("Something went wrong. Try again in a minute.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

function appendTerminalEntry(history, command, output, kind = "") {
  const commandLine = document.createElement("span");
  commandLine.className = "terminal-line terminal-command";
  commandLine.textContent = `logan@la:~$ ${command}`;

  const outputLine = document.createElement("span");
  outputLine.className = `terminal-line terminal-output${kind ? ` is-${kind}` : ""}`;
  outputLine.textContent = output;

  history.append(commandLine, outputLine);
}

function initTerminal() {
  const form = select("#terminal-form");
  const input = select("#terminal-input");
  const history = select("#terminal-history");
  if (!form || !input || !history) return;

  let introTimer;
  let introActive = true;

  const cancelIntro = () => {
    introActive = false;
    window.clearTimeout(introTimer);
  };

  const renderIntroLine = (index = 0) => {
    if (!introActive || index >= TERMINAL_INTRO.length) return;
    const [command, output] = TERMINAL_INTRO[index];
    appendTerminalEntry(history, command, output, index === TERMINAL_INTRO.length - 1 ? "ok" : "");

    if (prefersReducedMotion) renderIntroLine(index + 1);
    else introTimer = window.setTimeout(() => renderIntroLine(index + 1), 260);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const command = input.value.trim().toLowerCase();
    input.value = "";
    if (!command) return;

    cancelIntro();
    const entry = Object.hasOwn(TERMINAL_COMMANDS, command) ? TERMINAL_COMMANDS[command] : null;

    if (!entry) {
      appendTerminalEntry(history, command, `command not found: ${command} | try: help`, "warn");
      return;
    }

    if (entry.action === "clear") {
      history.replaceChildren();
      return;
    }

    appendTerminalEntry(history, command, entry.output, entry.kind);
    if (entry.target) select(entry.target)?.scrollIntoView({ behavior: scrollBehavior });
  });

  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    form.requestSubmit();
  });

  renderIntroLine();
}

function initFeedback() {
  const items = selectAll(".feedback-item");
  const buttons = selectAll("[data-feedback-filter]");
  const search = select("#feedback-search");
  const count = select("#feedback-count");
  if (!items.length || !buttons.length || !search || !count) return;

  let activeFilter = "all";

  const update = () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;

    items.forEach((item) => {
      const matchesFilter = activeFilter === "all" || item.dataset.feedbackCategory === activeFilter;
      const matchesQuery = !query || item.textContent.toLowerCase().includes(query);
      item.hidden = !(matchesFilter && matchesQuery);
      if (!item.hidden) visible += 1;
    });

    count.textContent = `${visible} of ${items.length} responses`;
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.feedbackFilter;
      buttons.forEach((candidate) => {
        candidate.setAttribute("aria-pressed", String(candidate === button));
      });
      update();
    });
  });

  search.addEventListener("input", update);
  update();
}

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
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });

  nodes.forEach((node) => observer.observe(node));
}

function initProgress() {
  const bar = select("#progress-bar");
  if (!bar) return;

  let framePending = false;
  const update = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${maxScroll > 0 ? window.scrollY / maxScroll : 0})`;
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
    second: "2-digit",
    hourCycle: "h23",
    timeZone: SITE.timeZone
  });

  const tick = () => {
    clock.textContent = `${format.format(new Date())} PT`;
  };

  tick();
  window.setInterval(tick, 1000);
}

function initMap() {
  const container = select("#la-map");
  if (!container) return;

  const fallback = select(".map-fallback", container);
  const leaflet = window.L;
  if (!leaflet) return;

  const { lat, lng, zoom } = SITE.location;
  const map = leaflet.map(container, {
    center: [lat, lng],
    zoom,
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: true
  });

  map.attributionControl.setPrefix(false);
  leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).once("tileload", () => fallback?.remove()).addTo(map);

  leaflet.marker([lat, lng], {
    icon: leaflet.divIcon({ className: "map-marker", iconSize: [12, 12] }),
    keyboard: false
  }).addTo(map);

  selectAll("[data-map-reset]").forEach((button) => {
    button.addEventListener("click", () => {
      map.flyTo([lat, lng], zoom, { duration: prefersReducedMotion ? 0 : 0.6 });
    });
  });
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
    if (!commit?.sha) throw new Error("No commit returned");

    sha.textContent = commit.sha.slice(0, 7);
    link.href = commit.html_url;
    link.title = commit.commit?.message?.split("\n")[0] || "Latest public GitHub commit";
  } catch {
    sha.textContent = "github";
  }
}

function initSectionNavigation() {
  const links = selectAll(".nav-links a");
  const sections = links
    .map((link) => select(link.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    const current = entries.find((entry) => entry.isIntersecting);
    if (!current) return;

    links.forEach((link) => {
      link.classList.toggle("is-current", link.hash === `#${current.target.id}`);
    });
  }, { rootMargin: "-38% 0px -56% 0px" });

  sections.forEach((section) => observer.observe(section));
}

function initPage() {
  setCurrentYear();
  initReveal();
  initContactForm();
  initTerminal();
  initFeedback();
  initProgress();
  initClock();
  initMap();
  loadLatestCommit();
  initSectionNavigation();
}

initPage();
