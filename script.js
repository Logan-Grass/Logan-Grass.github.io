/* ------------------------------------------------------------------
   EDIT THIS BLOCK — contact links, footer icons, and the schema.org
   data are all generated from these values. Leave "" to skip one.
   ------------------------------------------------------------------ */
const CONTACT = {
  email: "",                 // optional — leave "" to keep your address out of the page entirely
  phone: "",                 // optional, e.g. "+1 (555) 123-4567"
  linkedin: "",              // e.g. "https://www.linkedin.com/in/logangrass"
  github: "https://github.com/Logan-Grass",
  // Contact form relay. Managed at https://formspree.io — email lives in
  // the Formspree dashboard, never in this file.
  form: "https://formspree.io/f/mdaqdreg"
};

const LOCATION = { lat: 34.0522, lng: -118.2437, zoom: 11 };
const REPO = "Logan-Grass/Logan-Grass.github.io";

/* ------------------------------------------------------------------ */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ICONS = {
  email: '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path></svg>',
  phone: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1.1 1A16 16 0 0 1 4 5.1 1 1 0 0 1 5 4Z"></path></svg>',
  linkedin: '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4"></path></svg>',
  github: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"></path></svg>',
  resume: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M14 3v4a2 2 0 0 0 2 2h4"></path><path d="M5 12V5a2 2 0 0 1 2-2h7l6 6v3"></path><path d="M12 17v-6"></path><path d="m9 14 3 3 3-3"></path><path d="M5 21h14"></path></svg>'
};

function buildMethods() {
  const list = [];
  if (CONTACT.email) {
    list.push({ key: "email", href: `mailto:${CONTACT.email}`, label: CONTACT.email, note: "email" });
  }
  if (CONTACT.phone) {
    list.push({
      key: "phone",
      href: `tel:${CONTACT.phone.replace(/[^\d+]/g, "")}`,
      label: CONTACT.phone,
      note: "phone"
    });
  }
  if (CONTACT.linkedin) {
    list.push({ key: "linkedin", href: CONTACT.linkedin, label: "LinkedIn", note: "linkedin" });
  }
  if (CONTACT.github) {
    list.push({ key: "github", href: CONTACT.github, label: "github.com/Logan-Grass", note: "github" });
  }
  return list;
}

const isExternal = (key) => key === "linkedin" || key === "github";

function renderContact() {
  const target = document.querySelector("#contact-methods");
  if (!target) return;

  target.innerHTML = buildMethods()
    .map(
      (m) => `
      <a class="contact-method" href="${m.href}"${isExternal(m.key) ? ' rel="noopener"' : ""}>
        ${ICONS[m.key]}
        <span class="contact-method-text">
          <small>${m.note}</small>
          <strong>${m.label}</strong>
        </span>
      </a>`
    )
    .join("");

  if (!CONTACT.form && !CONTACT.email && !CONTACT.linkedin) {
    const warn = document.createElement("p");
    warn.className = "contact-warning";
    warn.textContent =
      "Set CONTACT.form (Formspree endpoint), email, or linkedin at the top of script.js — visitors currently have no way to reach you.";
    target.prepend(warn);
  }
}

/* ---------- contact form (static-host relay, keeps email out of the page) ---------- */

function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;
  if (!CONTACT.form) return; // stays hidden until a relay endpoint is configured

  form.hidden = false;
  const status = form.querySelector("#form-status");
  const submitButton = form.querySelector('button[type="submit"]');

  const setStatus = (message, kind) => {
    if (!status) return;
    status.textContent = message;
    status.className = `form-status${kind ? ` is-${kind}` : ""}`;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (form.querySelector('[name="_gotcha"]').value) return; // honeypot tripped — drop silently

    if (!form.reportValidity()) return;

    submitButton.disabled = true;
    setStatus("sending…");

    try {
      const response = await fetch(CONTACT.form, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      });

      if (!response.ok) throw new Error(`Relay responded ${response.status}`);

      form.reset();
      setStatus("Message sent — I'll get back to you soon.", "ok");
    } catch {
      setStatus("Something went wrong. Email me directly or try again in a minute.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

function renderFooterLinks() {
  const target = document.querySelector("#footer-links");
  if (!target) return;

  target.innerHTML =
    buildMethods()
      .map(
        (m) =>
          `<a href="${m.href}" aria-label="${m.note}"${isExternal(m.key) ? ' rel="noopener"' : ""}>${ICONS[m.key]}</a>`
      )
      .join("") +
    `<a href="assets/logan-grass-resume.pdf" download aria-label="Download resume">${ICONS.resume}</a>`;
}

function renderStructuredData() {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Logan Grass",
    jobTitle: "Systems Administrator & IT Infrastructure Specialist",
    url: "https://logangrass.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Los Angeles",
      addressRegion: "CA",
      addressCountry: "US"
    },
    worksFor: { "@type": "Organization", name: "ApexIT Consulting, LLC" },
    knowsAbout: [
      "Windows Server administration",
      "Active Directory",
      "Microsoft 365",
      "Microsoft Entra ID",
      "Network administration",
      "MikroTik RouterOS",
      "VLAN segmentation",
      "PowerShell automation",
      "Proxmox virtualization",
      "IT service management"
    ],
    hasCredential: [
      { "@type": "EducationalOccupationalCredential", name: "CompTIA Network+", credentialCategory: "certification" },
      { "@type": "EducationalOccupationalCredential", name: "CompTIA A+", credentialCategory: "certification" }
    ]
  };

  const sameAs = [CONTACT.linkedin, CONTACT.github].filter(Boolean);
  if (CONTACT.email) person.email = CONTACT.email;
  if (CONTACT.phone) person.telephone = CONTACT.phone;
  if (sameAs.length) person.sameAs = sameAs;

  const node = document.createElement("script");
  node.type = "application/ld+json";
  node.textContent = JSON.stringify(person);
  document.head.appendChild(node);
}

/* ---------- terminal ---------- */

const TERMINAL_LINES = [
  { cmd: "whoami", out: ['<span class="t-accent">Logan Grass</span> — systems &amp; infrastructure'] },
  { cmd: "uptime", out: ['<span class="t-out">5+ years in production · MSP → onsite ops</span>'] },
  { cmd: "ls ~/certs", out: ['<span class="t-out">a+.pdf   network+.pdf   <span class="t-warn">security+ (in progress)</span></span>'] },
  { cmd: "systemctl status logan", out: ['<span class="t-ok">●</span> <span class="t-out">active (running) — Los Angeles, CA</span>'] }
];

function runTerminal() {
  const body = document.querySelector("#terminal-body");
  if (!body) return;

  const promptHtml = '<span class="t-prompt">logan@la</span><span class="t-out">:~$</span> ';

  if (reducedMotion) {
    body.innerHTML =
      TERMINAL_LINES.map((l) => promptHtml + `<span class="t-cmd">${l.cmd}</span>\n` + l.out.join("\n") + "\n").join("") +
      promptHtml +
      '<span class="terminal-caret"></span>';
    return;
  }

  let html = "";
  let lineIndex = 0;

  const showPromptAndType = () => {
    if (lineIndex >= TERMINAL_LINES.length) {
      body.innerHTML = html + promptHtml + '<span class="terminal-caret"></span>';
      return;
    }

    const line = TERMINAL_LINES[lineIndex];
    let charIndex = 0;

    const typeChar = () => {
      if (charIndex <= line.cmd.length) {
        body.innerHTML =
          html +
          promptHtml +
          `<span class="t-cmd">${line.cmd.slice(0, charIndex)}</span>` +
          '<span class="terminal-caret"></span>';
        charIndex += 1;
        setTimeout(typeChar, 34 + Math.random() * 40);
      } else {
        html += promptHtml + `<span class="t-cmd">${line.cmd}</span>\n`;
        setTimeout(printOutput, 220);
      }
    };

    const printOutput = () => {
      html += line.out.join("\n") + "\n";
      body.innerHTML = html + '<span class="terminal-caret"></span>';
      lineIndex += 1;
      setTimeout(showPromptAndType, 340);
    };

    typeChar();
  };

  setTimeout(showPromptAndType, 500);
}

/* ---------- count-up stats ---------- */

function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (!counters.length) return;

  const animate = (node) => {
    const target = Number(node.dataset.count);
    if (reducedMotion || !Number.isFinite(target)) {
      node.textContent = String(target);
      return;
    }

    const duration = 900;
    const start = performance.now();

    const frame = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach((node) => (node.textContent = node.dataset.count));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach((node) => observer.observe(node));
}

/* ---------- scroll reveal ---------- */

function initReveal() {
  const nodes = document.querySelectorAll("[data-reveal]");
  if (!nodes.length) return;

  if (!("IntersectionObserver" in window) || reducedMotion) {
    document.body.classList.add("no-observer");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
  );

  nodes.forEach((node) => observer.observe(node));
}

/* ---------- marquee (duplicate content for seamless loop) ---------- */

function initMarquee() {
  document.querySelectorAll("[data-marquee]").forEach((track) => {
    track.innerHTML += track.innerHTML;
    track.querySelectorAll("blockquote").forEach((quote, index) => {
      if (index >= track.children.length / 2) quote.setAttribute("aria-hidden", "true");
    });
  });
}

/* ---------- progress bar ---------- */

function initProgress() {
  const bar = document.querySelector("#progress-bar");
  if (!bar) return;

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : "0%";
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
}

/* ---------- clock + session ---------- */

function startClock() {
  const nodes = [document.querySelector("#local-time"), document.querySelector("#local-time-2")].filter(Boolean);
  if (!nodes.length) return;

  const format = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Los_Angeles"
  });

  const tick = () => {
    const now = format.format(new Date());
    nodes.forEach((node) => (node.textContent = node.id === "local-time-2" ? `${now} PT` : now));
  };

  tick();
  setInterval(tick, 1000);
}

const pad = (value) => String(value).padStart(2, "0");

function startSessionTimer() {
  const node = document.querySelector("#session-time");
  if (!node) return;

  const started = Date.now();

  const tick = () => {
    const elapsed = Math.floor((Date.now() - started) / 1000);
    const minutes = Math.floor(elapsed / 60);
    node.textContent =
      minutes >= 60
        ? `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:${pad(elapsed % 60)}`
        : `${pad(minutes)}:${pad(elapsed % 60)}`;
  };

  tick();
  setInterval(tick, 1000);
}

/* ---------- map ---------- */

function initMap() {
  const container = document.querySelector("#la-map");
  if (!container || typeof L === "undefined") return;

  const loading = container.querySelector(".map-loading");

  const map = L.map(container, {
    center: [LOCATION.lat, LOCATION.lng],
    zoom: LOCATION.zoom,
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: true
  });

  map.attributionControl.setPrefix(false); // required OSM/CARTO credit stays; Leaflet self-plug goes

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    subdomains: "abcd",
    maxZoom: 19
  })
    .on("load", () => loading && loading.remove())
    .addTo(map);

  L.marker([LOCATION.lat, LOCATION.lng], {
    icon: L.divIcon({ className: "map-marker", iconSize: [12, 12] }),
    keyboard: false
  }).addTo(map);

  // If tiles are blocked or slow, stop showing the loading text forever.
  setTimeout(() => loading && loading.remove(), 4000);

  document.querySelectorAll("[data-map-reset]").forEach((button) => {
    button.addEventListener("click", () => {
      map.flyTo([LOCATION.lat, LOCATION.lng], LOCATION.zoom, { duration: 0.6 });
    });
  });
}

/* ---------- latest commit ---------- */

async function loadLatestCommit() {
  const shaNode = document.querySelector("#commit-sha");
  const link = document.querySelector("#commit-link");
  if (!shaNode || !link) return;

  try {
    const response = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=1`, {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!response.ok) throw new Error(`GitHub responded ${response.status}`);

    const [commit] = await response.json();
    if (!commit || !commit.sha) throw new Error("No commit returned");

    shaNode.textContent = commit.sha.slice(0, 7);
    link.href = commit.html_url;
    if (commit.commit && commit.commit.message) {
      link.title = commit.commit.message.split("\n")[0];
    }
  } catch {
    // Unauthenticated GitHub API is rate limited; the static fallback link stays.
    shaNode.textContent = "github";
  }
}

/* ---------- current nav section ---------- */

function markCurrentSection() {
  const links = Array.from(document.querySelectorAll(".nav-links a"));
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) =>
          link.classList.toggle("is-current", link.getAttribute("href") === `#${entry.target.id}`)
        );
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ---------- boot ---------- */

const yearNode = document.querySelector("#year");
if (yearNode) yearNode.textContent = new Date().getFullYear();

renderContact();
initContactForm();
renderFooterLinks();
renderStructuredData();
runTerminal();
initCounters();
initReveal();
initMarquee();
initProgress();
startClock();
startSessionTimer();
initMap();
loadLatestCommit();
markCurrentSection();
