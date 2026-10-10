const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".service-menu-toggle");
const serviceNav = document.querySelector(".service-nav");
const form = document.querySelector("#budget-form");
const planSelect = document.querySelector("#budget-plan");
const formError = document.querySelector("#form-error");
const formSuccess = document.querySelector("#form-success");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const setMenu = (isOpen) => {
  header?.classList.toggle("is-menu-open", isOpen);
  menuToggle?.setAttribute("aria-expanded", String(isOpen));
  menuToggle?.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
};

menuToggle?.addEventListener("click", () => setMenu(!header?.classList.contains("is-menu-open")));
serviceNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));

const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 20);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const revealItems = document.querySelectorAll(".reveal");
if (!reducedMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  revealItems.forEach((item, index) => {
    item.style.transitionDelay = (Math.min(index * 35, 220) + "ms");
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

document.querySelectorAll("[data-plan]").forEach((link) => link.addEventListener("click", () => {
  if (planSelect) planSelect.value = link.dataset.plan;
}));

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const whatsapp = String(data.get("whatsapp") || "").trim();
  formError.hidden = Boolean(name && whatsapp);
  formSuccess.hidden = true;
  if (!name || !whatsapp) return;

  const message = [
    "Olá! Tenho interesse em criar um site ou landing page com a _StackTrace.",
    "Nome: " + name,
    "WhatsApp: " + whatsapp,
    "Negócio: " + String(data.get("business") || "Não informado").trim(),
    "Formato: " + String(data.get("plan") || "Ainda não decidi"),
    "Projeto: " + String(data.get("message") || "Ainda vou explicar na conversa.").trim(),
  ].join("\n");
  const url = "https://wa.me/5551994612246?text=" + encodeURIComponent(message);
  window.open(url, "_blank", "noopener,noreferrer");
  formSuccess.hidden = false;
});

document.querySelector("[data-year]").textContent = new Date().getFullYear();
