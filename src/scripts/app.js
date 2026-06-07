const header = document.querySelector("[data-header]");
const year = document.querySelector("[data-year]");
const nav = document.querySelector("[data-nav]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const menuIcon = menuToggle?.querySelector("i");
const menuBackdrop = document.querySelector("[data-menu-backdrop]");
const menuLinks = Array.from(document.querySelectorAll("[data-menu-link]"));
const navLinks = Array.from(document.querySelectorAll(".nav a[href^='#']"));
const revealItems = Array.from(document.querySelectorAll(".reveal"));
const scrollPanels = Array.from(document.querySelectorAll("[data-scroll-panel]"));
const projectsSection = document.querySelector("[data-projects-scroll]");
const projectCards = Array.from(document.querySelectorAll("[data-project-card]"));
const processSection = document.querySelector("[data-process-scroll]");
const processCards = Array.from(document.querySelectorAll("[data-process-card]"));
const contactForm = document.querySelector("[data-contact-form]");
const contactStatus = document.querySelector("[data-contact-status]");
const mobileScrollPanelQuery = window.matchMedia("(max-width: 980px)");
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const initialImageSources = ["src/assets/hero-origami-bear.png", "src/assets/logo-bear.png"];
const loadingStartedAt = Date.now();

const preloadImage = (source) =>
  new Promise((resolve) => {
    const image = new Image();

    const finish = () => resolve();

    image.onload = () => {
      if (typeof image.decode === "function") {
        image.decode().catch(() => undefined).finally(finish);
        return;
      }

      finish();
    };

    image.onerror = finish;
    image.src = source;

    if (image.complete) {
      image.onload();
    }
  });

const showPage = () => {
  const minimumLoaderTime = 650;
  const remainingTime = Math.max(minimumLoaderTime - (Date.now() - loadingStartedAt), 0);

  window.setTimeout(() => {
    document.documentElement.classList.remove("is-loading");
    document.documentElement.classList.add("is-ready");
  }, remainingTime);
};

const initialImagesReady = Promise.all(initialImageSources.map(preloadImage));
const loaderFallback = new Promise((resolve) => {
  window.setTimeout(resolve, 4000);
});

Promise.race([initialImagesReady, loaderFallback]).then(showPage);

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
};

const syncMenuAccessibility = (isOpen = header?.classList.contains("is-menu-open")) => {
  if (!nav) {
    return;
  }

  const shouldHideMenu = mobileScrollPanelQuery.matches && !isOpen;

  nav.inert = shouldHideMenu;
  nav.toggleAttribute("inert", shouldHideMenu);

  if (shouldHideMenu) {
    nav.setAttribute("aria-hidden", "true");
  } else {
    nav.removeAttribute("aria-hidden");
  }
};

const setMenuOpen = (isOpen, options = {}) => {
  const shouldOpen = Boolean(isOpen && mobileScrollPanelQuery.matches);

  header?.classList.toggle("is-menu-open", shouldOpen);
  document.documentElement.classList.toggle("is-menu-open", shouldOpen);
  document.body.classList.toggle("is-menu-open", shouldOpen);
  menuToggle?.setAttribute("aria-expanded", String(shouldOpen));
  menuToggle?.setAttribute("aria-label", shouldOpen ? "Fechar menu" : "Abrir menu");
  syncMenuAccessibility(shouldOpen);

  if (menuIcon) {
    menuIcon.classList.toggle("fa-bars", !shouldOpen);
    menuIcon.classList.toggle("fa-xmark", shouldOpen);
  }

  if (shouldOpen && options.focusFirst) {
    window.setTimeout(() => {
      menuLinks[0]?.focus({ preventScroll: true });
    }, 160);
  }

  if (!shouldOpen && options.returnFocus) {
    menuToggle?.focus({ preventScroll: true });
  }
};

const closeMenu = (options = {}) => setMenuOpen(false, options);

const setContactStatus = (message, state = "idle") => {
  if (!contactStatus) {
    return;
  }

  contactStatus.textContent = message;
  contactStatus.dataset.state = state;
  contactStatus.hidden = !message;
};

const setContactSubmitting = (isSubmitting) => {
  const submitButton = contactForm?.querySelector("button[type='submit']");

  if (!submitButton) {
    return;
  }

  if (!submitButton.dataset.defaultText) {
    submitButton.dataset.defaultText = submitButton.textContent.trim();
  }

  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Enviando..." : submitButton.dataset.defaultText;
};

const handleContactSubmit = async (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);

  if (String(formData.get("_honey") || "").trim()) {
    contactForm.reset();
    setContactStatus("Mensagem enviada com sucesso.", "success");
    return;
  }

  setContactSubmitting(true);
  setContactStatus("Enviando mensagem...", "loading");

  try {
    const response = await fetch(contactForm.dataset.contactEndpoint || contactForm.action, {
      body: formData,
      method: "POST",
    });
    const result = await response.json().catch(() => ({}));
    const success = response.ok && (result.success || result.message || result.status === "success");

    if (!success) {
      throw new Error(result.message || "Nao foi possivel enviar a mensagem.");
    }

    contactForm.reset();
    setContactStatus("Mensagem enviada com sucesso. Em breve entraremos em contato.", "success");
  } catch (error) {
    setContactStatus(error.message || "Nao foi possivel enviar a mensagem.", "error");
  } finally {
    setContactSubmitting(false);
  }
};

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
  const isMobileScrollPanel = mobileScrollPanelQuery.matches;

  scrollPanels.forEach((panel, index) => {
    const track = panel.querySelector("[data-scroll-track]");

    if (!track) {
      return;
    }

    if (isMobileScrollPanel) {
      track.style.removeProperty("--panel-shift");
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

let isProcessStatic = false;

const updateProcessProgress = () => {
  if (!processSection) {
    return;
  }

  if (mobileScrollPanelQuery.matches) {
    if (!isProcessStatic) {
      processSection.style.setProperty("--process-progress", "1");

      processCards.forEach((card) => {
        card.style.setProperty("--process-card-progress", "1");
        card.classList.remove("is-process-active");
      });

      isProcessStatic = true;
    }

    return;
  }

  isProcessStatic = false;

  const rect = processSection.getBoundingClientRect();
  const scrollable = Math.max(rect.height - window.innerHeight, 1);
  const sectionProgress = Math.min(Math.max(-rect.top / scrollable, 0), 1);
  const cardCount = processCards.length;
  const activeIndex = Math.min(Math.max(Math.floor(sectionProgress * cardCount), 0), cardCount - 1);
  const easeProgress = (value) => value * value * (3 - 2 * value);

  processSection.style.setProperty("--process-progress", sectionProgress.toFixed(3));

  processCards.forEach((card, index) => {
    const start = cardCount > 1 ? index * (0.58 / (cardCount - 1)) : 0;
    const duration = 0.34;
    const rawProgress = (sectionProgress - start) / duration;
    const progress = easeProgress(Math.min(Math.max(rawProgress, 0), 1));
    const center = cardCount > 1 ? index / (cardCount - 1) : 0;
    const rawFocus = 1 - Math.min(Math.abs(sectionProgress - center) / 0.32, 1);
    const focus = easeProgress(Math.max(rawFocus, 0));

    card.style.setProperty("--process-card-progress", progress.toFixed(3));
    card.classList.toggle("is-process-active", index === activeIndex || focus > 0.64);
  });
};

year.textContent = new Date().getFullYear();
updateHeader();
updateActiveLink();
updateScrollPanels();
updateProjectsProgress();
updateProcessProgress();
syncMenuAccessibility();

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
  setMenuOpen(!header?.classList.contains("is-menu-open"), { focusFirst: true });
});

menuLinks.forEach((link) => {
  link.addEventListener("click", () => closeMenu());
});

menuBackdrop?.addEventListener("click", () => {
  closeMenu({ returnFocus: true });
});

contactForm?.addEventListener("submit", handleContactSubmit);

document.addEventListener("click", (event) => {
  if (header?.classList.contains("is-menu-open") && !header.contains(event.target)) {
    closeMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu({ returnFocus: true });
    return;
  }

  if (
    event.key === "Tab" &&
    mobileScrollPanelQuery.matches &&
    header?.classList.contains("is-menu-open")
  ) {
    const focusableItems = [menuToggle, ...menuLinks].filter(Boolean);
    const firstItem = focusableItems[0];
    const lastItem = focusableItems[focusableItems.length - 1];

    if (!firstItem || !lastItem) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstItem) {
      event.preventDefault();
      lastItem.focus();
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault();
      firstItem.focus();
    }
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

  syncMenuAccessibility();
  updateScrollPanels();
  updateProjectsProgress();
  updateProcessProgress();
});
