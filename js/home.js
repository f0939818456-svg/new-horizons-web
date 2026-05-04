document.addEventListener("DOMContentLoaded", () => {
    initHeroCarousel();
    initLatestNews();
});

// ── Hero Carousel ─────────────────────────────────────────────────
function initHeroCarousel() {
    const slides = document.querySelectorAll(".hero__slide");
    const dotsContainer = document.getElementById("heroDots");
    if (slides.length === 0 || !dotsContainer) return;

    let currentIndex = 0;
    let timer;
    const slideInterval = 5000;

    slides.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.classList.add("hero__dot");
        if (index === 0) dot.classList.add("is-active");
        dot.addEventListener("click", () => { goToSlide(index); resetTimer(); });
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll(".hero__dot");

    function goToSlide(index) {
        slides[currentIndex].classList.remove("is-active");
        dots[currentIndex].classList.remove("is-active");
        currentIndex = index;
        slides[currentIndex].classList.add("is-active");
        dots[currentIndex].classList.add("is-active");
    }

    function startTimer() {
        timer = setInterval(() => goToSlide((currentIndex + 1) % slides.length), slideInterval);
    }
    function resetTimer() { clearInterval(timer); startTimer(); }
    startTimer();
}

// ── Latest News Auto-Sync from /blog ─────────────────────────────
//
// 機制：抓取 /blog/index.html，讀取 .article-card（含 data-pinned 與
// .article-card__date），按下列規則挑選首頁要顯示的卡片：
//   1. 凡標記 data-pinned="true" 的文章一定會出現（依出現順序排列在最前）
//   2. 剩下的位置，依日期 (.article-card__date 文字格式 YYYY.MM.DD) 由新到舊排序
//   3. 取前 N 篇（N 由 #latestNewsGrid 的 data-count 決定，預設 3）
// 這樣未來只要更新 /blog/index.html，首頁的最新消息會自動跟著走。
async function initLatestNews() {
    const grid = document.getElementById("latestNewsGrid");
    if (!grid) return;

    const source = grid.dataset.source || "/blog/index.html";
    const count  = parseInt(grid.dataset.count || "3", 10);

    try {
        const res = await fetch(source);
        if (!res.ok) throw new Error(res.status);
        const html = await res.text();

        const doc = new DOMParser().parseFromString(html, "text/html");
        // 排除 featured 大卡（會重複），只看 grid 裡的 article-card
        const candidates = Array.from(
            doc.querySelectorAll(".article-grid .article-card")
        );
        if (candidates.length === 0) {
            grid.innerHTML = "";
            return;
        }

        const pinned   = candidates.filter(c => c.dataset.pinned === "true");
        const unpinned = candidates.filter(c => c.dataset.pinned !== "true");

        const parseDate = el => {
            const txt = el.querySelector(".article-card__date")?.textContent?.trim() || "";
            const ts  = Date.parse(txt.replace(/\./g, "-"));
            return isNaN(ts) ? 0 : ts;
        };
        unpinned.sort((a, b) => parseDate(b) - parseDate(a));

        const chosen = [...pinned, ...unpinned].slice(0, count);

        grid.innerHTML = chosen.map(toNewsCard).join("");
    } catch (err) {
        console.error("無法載入最新文章:", err);
        grid.innerHTML = "";
    }
}

// 將 blog 的 article-card 轉成首頁的 news-card 結構
function toNewsCard(article) {
    const href     = article.getAttribute("href") || "#";
    const tagEl    = article.querySelector(".article-card__meta .tag");
    const tagClass = tagEl ? tagEl.className : "tag tag-brand";
    const tagText  = tagEl?.textContent?.trim() || "文章";
    const date     = article.querySelector(".article-card__date")?.textContent?.trim() || "";
    const title    = article.querySelector(".article-card__title")?.textContent?.trim() || "";
    const excerpt  = article.querySelector(".article-card__excerpt")?.textContent?.trim() || "";
    const img      = article.querySelector("img");
    const imgSrc   = img?.getAttribute("src") || "";
    const imgAlt   = img?.getAttribute("alt") || title;

    const escape = s => s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

    return `
      <a href="${escape(href)}" class="news-card">
        <div class="news-card__content">
          <div class="news-card__meta">
            <span class="${escape(tagClass)}">${escape(tagText)}</span>
            <span class="news-card__date">${escape(date)}</span>
          </div>
          <h3 class="news-card__title">${escape(title)}</h3>
          <p class="news-card__excerpt">${escape(excerpt)}</p>
          <span class="news-card__readmore">閱讀全文 →</span>
        </div>
        ${imgSrc ? `<div class="news-card__image"><img src="${escape(imgSrc)}" alt="${escape(imgAlt)}" loading="lazy"></div>` : ""}
      </a>
    `;
}