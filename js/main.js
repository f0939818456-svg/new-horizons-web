async function loadComponent(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    el.innerHTML = await res.text();
  } catch (err) {
    console.error("載入失敗:", err);
  }
}

loadComponent("#site-header", "/components/header.html").then(() => {
  setupHeaderInteractions();
});
loadComponent("#site-footer", "/components/footer.html");

function setupHeaderInteractions() {
  const root = document.querySelector("#site-header");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";

  const openMenu = root.querySelector("#openMenu");
  const mobileMenu = root.querySelector("#mobileMenu");
  const closeMenu = root.querySelector("#closeMenu");
  const backdrop = root.querySelector("#menuBackdrop");

  const lockScroll = () => document.body.classList.add("no-scroll");
  const unlockScroll = () => document.body.classList.remove("no-scroll");

  function closeAllMobileAccordions() {
    root.querySelectorAll(".submenu, [data-mmenu]").forEach(el => {
      el.classList.remove("is-open");
    });
  }

  function hideMobileMenu() {
    mobileMenu?.setAttribute("aria-hidden", "true");
    unlockScroll();
    closeAllMobileAccordions();
  }

  if (openMenu) {
    openMenu.addEventListener("click", e => {
      e.stopPropagation();
      mobileMenu?.setAttribute("aria-hidden", "false");
      lockScroll();
    });
  }

  if (closeMenu) closeMenu.addEventListener("click", hideMobileMenu);
  if (backdrop) backdrop.addEventListener("click", hideMobileMenu);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") hideMobileMenu();
  });

  // 手機 Accordion
  root.querySelectorAll("[data-mdropdown]").forEach(btn => {
    btn.addEventListener("click", e => {
      if (window.innerWidth > 900) return;

      e.preventDefault();
      e.stopPropagation();

      const next = btn.nextElementSibling;
      const target =
        next && (next.classList.contains("submenu") || next.hasAttribute("data-mmenu"))
          ? next
          : root.querySelector(`[data-mmenu="${btn.getAttribute("data-mdropdown")}"]`);

      if (!target) return;

      const isOpen = target.classList.contains("is-open");

      closeAllMobileAccordions();

      if (!isOpen) target.classList.add("is-open");
    });
  });
}