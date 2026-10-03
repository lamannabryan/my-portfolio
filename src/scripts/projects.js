const screenshotLinks = Array.from(document.querySelectorAll("[data-lightbox]"));

if (screenshotLinks.length && typeof HTMLDialogElement !== "undefined") {
  const viewer = document.createElement("dialog");
  viewer.className = "screenshot-viewer";
  viewer.setAttribute("aria-labelledby", "screenshot-title");
  viewer.innerHTML = `
    <div class="screenshot-toolbar">
      <p id="screenshot-title"></p>
      <button type="button" class="screenshot-close" aria-label="Fechar imagem">Fechar <span aria-hidden="true">×</span></button>
    </div>
    <div class="screenshot-content"><img alt="" /></div>
    <div class="screenshot-controls">
      <button type="button" data-previous aria-label="Imagem anterior">← Anterior</button>
      <span data-counter aria-live="polite"></span>
      <button type="button" data-next aria-label="Próxima imagem">Próxima →</button>
    </div>`;
  document.body.append(viewer);

  const viewerImage = viewer.querySelector("img");
  const viewerTitle = viewer.querySelector("#screenshot-title");
  const counter = viewer.querySelector("[data-counter]");
  let currentIndex = 0;
  let opener;

  const showScreenshot = (index) => {
    currentIndex = (index + screenshotLinks.length) % screenshotLinks.length;
    const link = screenshotLinks[currentIndex];
    const source = link.querySelector("img");
    viewerImage.src = link.href;
    viewerImage.alt = source.alt;
    viewerTitle.textContent = link.closest("figure").querySelector("h3").textContent;
    counter.textContent = `${currentIndex + 1} / ${screenshotLinks.length}`;
    viewer.querySelector(".screenshot-content").scrollTop = 0;
  };

  screenshotLinks.forEach((link, index) => {
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      showScreenshot(index);
      viewer.showModal();
      document.documentElement.classList.add("is-viewing-screenshot");
    });
  });

  viewer.querySelector(".screenshot-close").addEventListener("click", () => viewer.close());
  viewer.querySelector("[data-previous]").addEventListener("click", () => showScreenshot(currentIndex - 1));
  viewer.querySelector("[data-next]").addEventListener("click", () => showScreenshot(currentIndex + 1));
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      showScreenshot(currentIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  viewer.addEventListener("close", () => {
    document.documentElement.classList.remove("is-viewing-screenshot");
    opener?.focus({ preventScroll: true });
  });
}
