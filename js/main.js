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
 * Header 互動邏輯
 */
function setupHeaderInteractions() {
  const root = document.querySelector("#site-header");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";

  // -------------------------
  // A) 桌機/手機 下拉選單處理
  // -------------------------
  const dropdownButtons = root.querySelectorAll("[data-dropdown]");
  
  function closeAllDropdowns() {
    root.querySelectorAll(".nav__menu").forEach((m) => m.classList.remove("is-open"));
  }

  dropdownButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // 寬度大於 900px 時由 CSS Hover 控制，不執行 JS
      if (window.innerWidth > 900) return;

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
  // B) 手機側欄 (☰ 開/關)
  // -------------------------
  const openMenu = root.querySelector("#openMenu");
  const mobileMenu = root.querySelector("#mobileMenu");
  const closeMenu = root.querySelector("#closeMenu");
  const backdrop = root.querySelector("#menuBackdrop");

  if (openMenu) {
    openMenu.addEventListener("click", () => {
      mobileMenu?.setAttribute("aria-hidden", "false");
    });
  }

  const hideMobileMenu = () => {
    mobileMenu?.setAttribute("aria-hidden", "true");
    // 關閉側欄時順便關閉裡面可能開著的子選單
    root.querySelectorAll("[data-mmenu]").forEach(m => m.classList.remove("is-open"));
  };

  if (closeMenu) closeMenu.addEventListener("click", hideMobileMenu);
  if (backdrop) backdrop.addEventListener("click", hideMobileMenu);

  // 手機版側欄子選單 (Accordion)
  const mBtns = root.querySelectorAll("[data-mdropdown]");
  mBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const key = btn.getAttribute("data-mdropdown");
      const menuEl = root.querySelector(`[data-mmenu="${key}"]`);
      
      if (menuEl) {
        const isOpen = menuEl.classList.contains("is-open");
        // 如果想讓手機版一次只能開一個子選單，可以取消下面這行的註解：
        // root.querySelectorAll("[data-mmenu]").forEach(m => m.classList.remove("is-open"));
        menuEl.classList.toggle("is-open", !isOpen);
      }
    });
  });

  // 全域點擊關閉
  document.addEventListener("click", () => {
    if (window.innerWidth <= 900) closeAllDropdowns();
  });
}