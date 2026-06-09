/* =====================================================================
 * app.js — 모든 페이지 공통 부트스트랩
 * ---------------------------------------------------------------------
 *  · 테마 적용
 *  · 게시판 목록으로 내비게이션 자동 생성
 *  · "주인 모드"(PIN) : 잠금 해제하면 글쓰기/편집/스킨 버튼이 보입니다.
 *  · 맨 위로 버튼, 펼침(fold) 토글
 *  주인 모드는 화면 잠금일 뿐 진짜 보안이 아닙니다.
 *  실제 보안은 Firebase 규칙으로 합니다(docs/FIREBASE.md 참고).
 * ===================================================================== */
(function (global) {
  "use strict";

  var root = document.documentElement.getAttribute("data-root") || "";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- 주인 모드 ---------- */
  function isOwner() {
    try {
      return sessionStorage.getItem("sq:owner") === "1";
    } catch (e) {
      return false;
    }
  }
  function setOwner(on) {
    try {
      if (on) sessionStorage.setItem("sq:owner", "1");
      else sessionStorage.removeItem("sq:owner");
    } catch (e) {}
    document.body.classList.toggle("is-owner", !!on);
  }
  function toggleOwner() {
    if (isOwner()) {
      setOwner(false);
      return;
    }
    SQStore.getSite().then(function (site) {
      var pin = (site.owner && site.owner.pin) || "";
      if (!pin) {
        setOwner(true); // PIN 미설정이면 바로 주인 모드
        return;
      }
      var input = window.prompt("주인 PIN을 입력하세요");
      if (input == null) return;
      if (input === String(pin)) setOwner(true);
      else window.alert("PIN이 일치하지 않습니다.");
    });
  }

  /* ---------- 내비게이션 ---------- */
  function buildNav(active) {
    var mount = document.getElementById("site-nav");
    if (!mount) return Promise.resolve();
    return SQStore.getBoards().then(function (boards) {
      var links = boards
        .map(function (b) {
          var href =
            b.id === "home"
              ? root + "index.html"
              : root + "board.html?board=" + encodeURIComponent(b.id);
          var cls = b.id === active ? ' class="is-active"' : "";
          return (
            '<a href="' +
            esc(href) +
            '"' +
            cls +
            "><span class=\"nav-ico\">" +
            esc(b.icon || "·") +
            "</span>" +
            esc(b.name) +
            "</a>"
          );
        })
        .join("");

      var tools =
        '<span class="nav-tools">' +
        '<a class="owner-only" href="' +
        root +
        'write.html">＋ 글쓰기</a>' +
        '<a class="owner-only" href="' +
        root +
        'editor.html">⚙ 스킨</a>' +
        '<button type="button" id="owner-toggle" class="nav-lock" title="주인 모드">⌥</button>' +
        "</span>";

      mount.innerHTML = '<div class="nav-links">' + links + "</div>" + tools;

      var lock = document.getElementById("owner-toggle");
      if (lock) lock.addEventListener("click", toggleOwner);
    });
  }

  /* ---------- 공통 UI ---------- */
  function initScrollTop() {
    var btn = document.getElementById("scroll-top");
    if (!btn) return;
    function toggle() {
      btn.classList.toggle("is-visible", window.scrollY > 240);
    }
    window.addEventListener("scroll", toggle, { passive: true });
    toggle();
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function hideLoader() {
    var l = document.getElementById("loader");
    if (l) setTimeout(function () {
      l.classList.add("is-done");
    }, 200);
  }

  function boot() {
    setOwner(isOwner());
    var active =
      (document.getElementById("site-nav") &&
        document.getElementById("site-nav").getAttribute("data-active")) ||
      "";
    var p = global.SQTheme ? SQTheme.init() : Promise.resolve();
    p.then(function () {
      return buildNav(active);
    }).then(function () {
      initScrollTop();
      hideLoader();
    });
  }

  global.SQApp = {
    esc: esc,
    root: root,
    isOwner: isOwner,
    setOwner: setOwner
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
