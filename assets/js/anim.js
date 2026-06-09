/* =====================================================================
 * anim.js — 화면 애니메이션 레이어 (SQAnim)
 * ---------------------------------------------------------------------
 *  · Lenis(있으면) 부드러운 관성 스크롤
 *  · [data-reveal] 요소를 스크롤 진입 시 부드럽게 등장 (IntersectionObserver)
 *  · prefers-reduced-motion 존중
 *  라이브러리가 없어도 IntersectionObserver 로 동작합니다.
 * ===================================================================== */
(function (global) {
  "use strict";

  var reduced =
    global.matchMedia &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initSmoothScroll() {
    if (reduced || !global.Lenis) return null;
    try {
      var lenis = new Lenis({ duration: 1.05, smoothWheel: true });
      function raf(t) {
        lenis.raf(t);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
      // GSAP ScrollTrigger 와 동기화
      if (global.ScrollTrigger)
        lenis.on("scroll", function () {
          ScrollTrigger.update();
        });
      return lenis;
    } catch (e) {
      return null;
    }
  }

  var io = null;
  function ensureObserver() {
    if (io || !global.IntersectionObserver) return io;
    io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-revealed");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    return io;
  }

  // scope 안의 [data-reveal] 요소를 관찰 시작
  function reveal(scope) {
    var els = (scope || document).querySelectorAll("[data-reveal]:not(.is-revealed)");
    if (reduced || !global.IntersectionObserver) {
      els.forEach(function (el) {
        el.classList.add("is-revealed");
      });
      return;
    }
    var ob = ensureObserver();
    var i = 0;
    els.forEach(function (el) {
      // 순차 등장 딜레이
      el.style.setProperty("--reveal-delay", (i % 8) * 55 + "ms");
      i++;
      ob.observe(el);
    });
  }

  function init() {
    initSmoothScroll();
    reveal(document);
  }

  global.SQAnim = { init: init, reveal: reveal };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})(window);
