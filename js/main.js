// ── Blog Pagination ───────────────────────────────────────────────
function setupBlogPagination() {
  document.querySelectorAll('.paginated-grid').forEach(grid => {
    const perPage = parseInt(grid.dataset.perPage || '12');
    const cards = Array.from(grid.querySelectorAll('.article-card'));
    if (cards.length <= perPage) return;

    const totalPages = Math.ceil(cards.length / perPage);
    let currentPage = 1;

    const paginationEl = document.createElement('div');
    paginationEl.className = 'pagination';
    grid.after(paginationEl);

    function showPage(page) {
      currentPage = page;
      cards.forEach((card, i) => {
        const inRange = i >= (page - 1) * perPage && i < page * perPage;
        // preserve original display or use '' to let CSS decide
        card.style.display = inRange ? '' : 'none';
      });
      renderPagination();
      // Scroll smoothly to just above the grid
      const offset = grid.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }

    function renderPagination() {
      paginationEl.innerHTML = '';

      if (currentPage > 1) {
        const prev = document.createElement('button');
        prev.className = 'page-btn wide';
        prev.textContent = '← 上一頁';
        prev.addEventListener('click', () => showPage(currentPage - 1));
        paginationEl.appendChild(prev);
      }

      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.addEventListener('click', () => showPage(i));
        paginationEl.appendChild(btn);
      }

      if (currentPage < totalPages) {
        const next = document.createElement('button');
        next.className = 'page-btn wide';
        next.textContent = '下一頁 →';
        next.addEventListener('click', () => showPage(currentPage + 1));
        paginationEl.appendChild(next);
      }
    }

    showPage(1);
  });
}

document.addEventListener('DOMContentLoaded', setupBlogPagination);

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

// Scroll shadow on header
window.addEventListener("scroll", () => {
  const header = document.querySelector(".site-header");
  if (header) {
    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
}, { passive: true });

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