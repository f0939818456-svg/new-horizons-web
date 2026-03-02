document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".hero__slide");
    const dotsContainer = document.getElementById("heroDots");
    if (slides.length === 0) return;

    let currentIndex = 0;
    let timer;
    const slideInterval = 5000;

    // 生成圓點
    slides.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.classList.add("hero__dot");
        if (index === 0) dot.classList.add("is-active");
        dot.addEventListener("click", () => {
            goToSlide(index);
            resetTimer();
        });
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
        timer = setInterval(() => {
            goToSlide((currentIndex + 1) % slides.length);
        }, slideInterval);
    }

    function resetTimer() {
        clearInterval(timer);
        startTimer();
    }

    startTimer();
});