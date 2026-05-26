const header = document.querySelector("[data-header]");
const year = document.querySelector("[data-year]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const menuIcon = menuToggle?.querySelector("i");
const navLinks = Array.from(document.querySelectorAll(".nav a"));
const revealItems = Array.from(document.querySelectorAll(".reveal"));
const scrollPanels = Array.from(document.querySelectorAll("[data-scroll-panel]"));
const projectsSection = document.querySelector("[data-projects-scroll]");
const projectCards = Array.from(document.querySelectorAll("[data-project-card]"));
const processSection = document.querySelector("[data-process-scroll]");
const processCards = Array.from(document.querySelectorAll("[data-process-card]"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
};

const setMenuOpen = (isOpen) => {
  header?.classList.toggle("is-menu-open", isOpen);
  menuToggle?.setAttribute("aria-expanded", String(isOpen));
  menuToggle?.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");

  if (menuIcon) {
    menuIcon.classList.toggle("fa-bars", !isOpen);
    menuIcon.classList.toggle("fa-xmark", isOpen);
  }
};

const closeMenu = () => setMenuOpen(false);

const updateActiveLink = () => {
  let current = sections[0];

  sections.forEach((section) => {
    if (section.offsetTop <= window.scrollY + 180) {
      current = section;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", current?.id === link.getAttribute("href").slice(1));
  });
};

const updateScrollPanels = () => {
  scrollPanels.forEach((panel, index) => {
    const track = panel.querySelector("[data-scroll-track]");

    if (!track) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const travel = Math.max(track.scrollWidth - panel.clientWidth, 0);
    const total = window.innerHeight + rect.height;
    const progress = Math.min(Math.max((window.innerHeight - rect.top) / total, 0), 1);
    const direction = index % 2 === 0 ? -1 : 1;
    const shift = direction === -1 ? -travel * progress : -travel + travel * progress;

    track.style.setProperty("--panel-shift", `${shift}px`);
  });
};

const updateProjectsProgress = () => {
  if (!projectsSection) {
    return;
  }

  const rect = projectsSection.getBoundingClientRect();
  const total = window.innerHeight + rect.height;
  const sectionProgress = Math.min(Math.max((window.innerHeight - rect.top) / total, 0), 1);
  const parallax = (sectionProgress - 0.5) * 320;

  projectsSection.style.setProperty("--projects-progress", sectionProgress.toFixed(3));
  projectsSection.style.setProperty("--projects-parallax", `${parallax.toFixed(1)}px`);

  projectCards.forEach((card, index) => {
    const cardRect = card.getBoundingClientRect();
    const start = window.innerHeight * 0.9;
    const end = window.innerHeight * 0.38;
    const rawProgress = (start - cardRect.top) / (start - end);
    const progress = Math.min(Math.max(rawProgress, 0), 1);

    card.style.setProperty("--project-progress", progress.toFixed(3));
    card.classList.toggle("is-project-active", progress > 0.62 || index === 0);
  });
};

const updateProcessProgress = () => {
  if (!processSection) {
    return;
  }

  const rect = processSection.getBoundingClientRect();
  const scrollable = Math.max(rect.height - window.innerHeight, 1);
  const sectionProgress = Math.min(Math.max(-rect.top / scrollable, 0), 1);

  processSection.style.setProperty("--process-progress", sectionProgress.toFixed(3));

  processCards.forEach((card, index) => {
    const start = index * 0.18;
    const duration = 0.28;
    const rawProgress = (sectionProgress - start) / duration;
    const progress = Math.min(Math.max(rawProgress, 0), 1);

    card.style.setProperty("--process-card-progress", progress.toFixed(3));
  });
};

year.textContent = new Date().getFullYear();
updateHeader();
updateActiveLink();
updateScrollPanels();
updateProjectsProgress();
updateProcessProgress();

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index * 45, 240)}ms`);
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

menuToggle?.addEventListener("click", () => {
  setMenuOpen(!header?.classList.contains("is-menu-open"));
});

navLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("click", (event) => {
  if (header?.classList.contains("is-menu-open") && !header.contains(event.target)) {
    closeMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

let scrollFrame = null;

const updateScrollState = () => {
  updateHeader();
  updateActiveLink();
  updateScrollPanels();
  updateProjectsProgress();
  updateProcessProgress();
  scrollFrame = null;
};

window.addEventListener(
  "scroll",
  () => {
    if (scrollFrame === null) {
      scrollFrame = window.requestAnimationFrame(updateScrollState);
    }
  },
  { passive: true },
);

window.addEventListener("resize", () => {
  if (window.innerWidth > 980) {
    closeMenu();
  }

  updateScrollPanels();
  updateProjectsProgress();
  updateProcessProgress();
});
