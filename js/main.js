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
 * - 桌機 (>900px)：完全交給 CSS hover（不改你原功能）
 * - 手機 (<=900px)：JS 控制 dropdown + 側欄 + 自動生成跳轉連結
 */
function setupHeaderInteractions() {
  const root = document.querySelector("#site-header");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1"; // 防止重複綁定事件

  // -------------------------
  // A) Dropdown 處理（手機點擊）
  // -------------------------
  const dropdownButtons = root.querySelectorAll("[data-dropdown]");

  function closeAllDropdowns() {
    root.querySelectorAll(".nav__menu").forEach((m) => m.classList.remove("is-open"));
  }

  dropdownButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // 桌機：交給 CSS hover
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
  // B) 手機側欄（☰ 開/關）
  // -------------------------
  const openMenu = root.querySelector("#openMenu");
  const mobileMenu = root.querySelector("#mobileMenu");
  const closeMenu = root.querySelector("#closeMenu");
  const backdrop = root.querySelector("#menuBackdrop");

  const lockScroll = () => document.body.classList.add("no-scroll");
  const unlockScroll = () => document.body.classList.remove("no-scroll");

  // ✅ 從桌機 .desktop-nav 複製一份到手機側欄（不動桌機）
  function buildMobileLinksIfEmpty() {
    if (!mobileMenu) return;

    const panel = mobileMenu.querySelector(".mobile-panel");
    if (!panel) return;

    // 如果已經有容器就復用；沒有就建
    let mobileLinks = panel.querySelector(".mobile-links");
    if (!mobileLinks) {
      mobileLinks = document.createElement("nav");
      mobileLinks.className = "mobile-links";
      panel.appendChild(mobileLinks);
    }

    // 已經生成過就不重複塞
    if (mobileLinks.children.length > 0) return;

    const desktopNav = root.querySelector(".desktop-nav");
    if (!desktopNav) return;

    Array.from(desktopNav.children).forEach((item) => {
      // 1) 一般連結：a.nav__link
      const directLink = item.matches?.("a.nav__link")
        ? item
        : item.querySelector?.("a.nav__link");

      if (directLink) {
        const a = directLink.cloneNode(true);
        mobileLinks.appendChild(a);
        return;
      }

      // 2) 下拉選單群：.nav__dropdown
      const dropdown = item.classList?.contains("nav__dropdown")
        ? item
        : item.querySelector?.(".nav__dropdown");

      if (dropdown) {
        const btn = dropdown.querySelector(".nav__btn");
        const title = btn ? btn.textContent.trim() : "Menu";

        const group = document.createElement("div");
        group.className = "mobile-group";

        const groupTitle = document.createElement("div");
        groupTitle.className = "mobile-group-title";
        groupTitle.textContent = title;

        const groupList = document.createElement("div");
        groupList.className = "mobile-group-list";

        dropdown.querySelectorAll(".nav__menu a").forEach((subA) => {
          const a = subA.cloneNode(true);
          groupList.appendChild(a);
        });

        group.appendChild(groupTitle);
        group.appendChild(groupList);
        mobileLinks.appendChild(group);
      }
    });
  }

  const hideMobileMenu = () => {
    mobileMenu?.setAttribute("aria-hidden", "true");
    unlockScroll();
    closeAllDropdowns();
  };

  if (openMenu) {
    openMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      buildMobileLinksIfEmpty(); // ✅ 確保側欄有跳轉連結
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

  // 回到桌機寬度時，自動收起側欄（避免鎖滾動卡住）
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) hideMobileMenu();
  });

  // -------------------------
  // C) 手機側欄子選單 Accordion（如果你 header.html 有用 data-mdropdown/data-mmenu）
  // -------------------------
  const mBtns = root.querySelectorAll("[data-mdropdown]");
  mBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = btn.getAttribute("data-mdropdown");
      const menuEl = root.querySelector(`[data-mmenu="${key}"]`);
      menuEl?.classList.toggle("is-open");
    });
  });

  // -------------------------
  // D) 全域點擊關閉（只針對手機，且點 header 內不誤關）
  // -------------------------
  document.addEventListener("click", (e) => {
    if (window.innerWidth > 900) return; // 桌機不干涉
    if (root.contains(e.target)) return; // 點 header/側欄內不關
    closeAllDropdowns();
  });
}