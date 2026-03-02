/**
 * 載入外部 HTML 組件 (Header / Footer)
 */
async function loadComponent(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    el.innerHTML = await res.text();
  } catch (err) {
    console.error(`載入組件失敗: ${url}`, err);
    el.innerHTML = `<p style="color:red; padding:10px;">載入失敗：${url}</p>`;
  }
}

// 啟動：載入 Header 與 Footer
loadComponent("#site-header", "/components/header.html").then(() => {
  setupHeaderInteractions();
});

loadComponent("#site-footer", "/components/footer.html");

/**
 * Header 互動邏輯 (Dropdown, Mobile Menu)
 * - 桌機 (>900px)：交給 CSS hover（不動你的桌機功能）
 * - 手機 (<=900px)：JS 控制側欄 + accordion + 點擊關閉規則
 */
function setupHeaderInteractions() {
  const root = document.querySelector("#site-header");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";

  // -------------------------
  // A) Dropdown（手機點擊開關；桌機交給 hover）
  // -------------------------
  const dropdownButtons = root.querySelectorAll("[data-dropdown]");

  function closeAllDropdowns() {
    root.querySelectorAll(".nav__menu").forEach((m) => m.classList.remove("is-open"));
  }

  dropdownButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (window.innerWidth > 900) return; // 桌機不介入

      e.preventDefault();
      e.stopPropagation();

      const key = btn.getAttribute("data-dropdown");
      const menuEl = root.querySelector(`[data-menu="${key}"]`);
      if (!menuEl) return;

      const isOpen = menuEl.classList.contains("is-open");
      closeAllDropdowns();
      if (!isOpen) menuEl.classList.add("is-open");
    });
  });

  // -------------------------
  // B) Mobile sidebar open/close
  // -------------------------
  const openMenu = root.querySelector("#openMenu");
  const mobileMenu = root.querySelector("#mobileMenu");
  const closeMenu = root.querySelector("#closeMenu");
  const backdrop = root.querySelector("#menuBackdrop");

  const lockScroll = () => document.body.classList.add("no-scroll");
  const unlockScroll = () => document.body.classList.remove("no-scroll");

  // 取 mobile panel（手機側欄內容區）
  const panel = mobileMenu?.querySelector(".mobile-panel") || root;

  function closeAllMobileAccordions() {
    panel.querySelectorAll?.(".submenu, .mobile-submenu, [data-mmenu]").forEach((el) => {
      el.classList.remove("is-open");
      if (el.setAttribute) el.setAttribute("aria-hidden", "true");
    });

    panel.querySelectorAll?.("[data-mdropdown]").forEach((btn) => {
      if (btn.setAttribute) btn.setAttribute("aria-expanded", "false");
    });
  }

  const hideMobileMenu = () => {
    mobileMenu?.setAttribute("aria-hidden", "true");
    unlockScroll();
    closeAllDropdowns();
    closeAllMobileAccordions();
  };

  if (openMenu) {
    openMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      mobileMenu?.setAttribute("aria-hidden", "false");
      lockScroll();
    });
  }

  if (closeMenu) closeMenu.addEventListener("click", hideMobileMenu);
  if (backdrop) backdrop.addEventListener("click", hideMobileMenu);

  // ESC 關閉
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideMobileMenu();
  });

  // 回到桌機寬度時，自動關側欄（避免卡住 no-scroll）
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) hideMobileMenu();
  });

  // -------------------------
  // C) Mobile accordion（支援兩種結構）
  // 1) data-mdropdown="x" 搭配 data-mmenu="x"
  // 2) 按鈕後面緊跟 submenu 容器（nextElementSibling）
  // -------------------------
  function getSubmenuForButton(btn) {
    const key = btn.getAttribute("data-mdropdown");

    // 結構 1：用 key 找
    if (key) {
      const byKey =
        panel.querySelector?.(`[data-mmenu="${key}"]`) ||
        panel.querySelector?.(`.submenu[data-key="${key}"]`) ||
        panel.querySelector?.(`.mobile-submenu[data-key="${key}"]`);
      if (byKey) return byKey;
    }

    // 結構 2：找按鈕後面的 submenu
    const next = btn.nextElementSibling;
    if (
      next &&
      (next.matches?.("[data-mmenu]") ||
        next.classList?.contains("submenu") ||
        next.classList?.contains("mobile-submenu"))
    ) {
      return next;
    }

    return null;
  }

  const mBtns = panel.querySelectorAll?.("[data-mdropdown]") || [];
  mBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (window.innerWidth > 900) return; // 桌機不介入

      e.preventDefault();
      e.stopPropagation();

      const submenu = getSubmenuForButton(btn);
      if (!submenu) return;

      const isOpen = submenu.classList.contains("is-open");

      // 先關其他
      closeAllMobileAccordions();

      // 再開自己
      if (!isOpen) {
        submenu.classList.add("is-open");
        if (submenu.setAttribute) submenu.setAttribute("aria-hidden", "false");
        if (btn.setAttribute) btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  // -------------------------
  // D) 全域點擊：手機點 header 外關閉 dropdown（不影響桌機）
  // -------------------------
  document.addEventListener("click", (e) => {
    if (window.innerWidth > 900) return;
    if (root.contains(e.target)) return;
    closeAllDropdowns();
  });
}