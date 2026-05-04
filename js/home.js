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

// ── Latest News Auto-Sync from blog 分類頁 ───────────────────────
//
// 機制：分別抓取「學校相關 / 考試相關 / 經驗分享」三個分類頁，
// 從每頁的 .article-grid 取出 .article-card，依下列規則挑選：
//   1. data-pinned="true" 的文章一定出現（依分類頁出現順序）
//   2. 剩下的位置，依日期 (.article-card__date 格式 YYYY.MM.DD) 由新到舊排序
//   3. 同一篇文章（同 href）只取一次
//   4. 最終取前 N 篇（N 由 #latestNewsGrid 的 data-count 決定，預設 3）
// 之後只要更新分類頁，首頁的最新消息會自動同步。
async function initLatestNews() {
    const grid = document.getElementById("latestNewsGrid");
    if (!grid) return;

    const sources = (grid.dataset.sources || grid.dataset.source ||
        "/blog/school.html,/blog/exam.html,/blog/experience.html"
    ).split(",").map(s => s.trim()).filter(Boolean);
    const count = parseInt(grid.dataset.count || "3", 10);

    try {
        const docs = await Promise.all(sources.map(async url => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(url + ": " + res.status);
            const html = await res.text();
            return new DOMParser().parseFromString(html, "text/html");
        }));

        const seen = new Set();
        const candidates = [];
        for (const doc of docs) {
            doc.querySelectorAll(".article-grid .article-card").forEach(card => {
                const href = card.getAttribute("href");
                if (!href || href === "#" || seen.has(href)) return;
                seen.add(href);
                candidates.push(card);
            });
        }

        if (candidates.length === 0) { grid.innerHTML = ""; return; }

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