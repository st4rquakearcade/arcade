/* =====================================================================
 * app.js — 모든 페이지 공통 부트스트랩
 * ---------------------------------------------------------------------
 *  · 테마 적용
 *  · 게시판 목록으로 내비게이션 자동 생성
 *  · 로그인 상태/등급에 따라 메뉴(글쓰기·스킨·회원관리·로그인) 표시
 *  · 로더(무한 로딩) 안전장치
 * ===================================================================== */
(function (global) {
  "use strict";

  var root = document.documentElement.getAttribute("data-root") || "";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function auth() {
    return global.SQAuth;
  }
  function hasPerm(p) {
    return auth() ? SQAuth.hasPerm(p) : false;
  }

  /* 로그인 상태를 <body> 클래스로 반영 (CSS 에서 표시 제어) */
  function applyAuthClasses() {
    var b = document.body;
    var loggedIn = auth() && SQAuth.isLoggedIn();
    b.classList.toggle("is-auth", !!loggedIn);
    b.classList.toggle("is-admin", auth() ? SQAuth.isAdmin() : false);
    b.classList.toggle("is-owner", hasPerm("manageSite")); // 기존 owner-only 호환
    ["superadmin", "subadmin", "member"].forEach(function (r) {
      b.classList.toggle("role-" + r, loggedIn && SQAuth.role() === r);
    });
  }

  /* data-perm 속성을 가진 요소를 권한에 따라 보이거나 숨김 */
  function applyPerms(scope) {
    (scope || document).querySelectorAll("[data-perm]").forEach(function (el) {
      el.hidden = !hasPerm(el.getAttribute("data-perm"));
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
            '><span class="nav-ico">' +
            esc(b.icon || "·") +
            "</span>" +
            esc(b.name) +
            "</a>"
          );
        })
        .join("");

      mount.innerHTML =
        '<div class="nav-links">' + links + "</div>" + navTools();

      bindNavTools();
    });
  }

  function navTools() {
    var loggedIn = auth() && SQAuth.isLoggedIn();
    var html = '<span class="nav-tools">';
    if (loggedIn) {
      var u = SQAuth.current();
      // 글쓰기: 회원 이상
      if (hasPerm("writeMember"))
        html += '<a href="' + root + 'write.html">＋ 글쓰기</a>';
      // 스킨: 사이트 관리 권한
      if (hasPerm("manageSite"))
        html += '<a href="' + root + 'editor.html">⚙ 스킨</a>';
      // 회원관리: 최고 관리자
      if (hasPerm("manageUsers"))
        html += '<a href="' + root + 'editor.html#users">👥 회원</a>';
      html +=
        '<a href="' +
        root +
        'account.html" class="nav-user" title="' +
        esc(SQAuth.ROLE_LABEL[u.role] || "") +
        '">' +
        esc(u.displayName) +
        "</a>";
      html += '<button type="button" id="logout-btn" class="nav-lock" title="로그아웃">⏻</button>';
    } else {
      html += '<a href="' + root + 'account.html">로그인</a>';
    }
    html += "</span>";
    return html;
  }

  function bindNavTools() {
    var out = document.getElementById("logout-btn");
    if (out)
      out.addEventListener("click", function () {
        SQAuth.logout();
        location.reload();
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
    if (l) l.classList.add("is-done");
  }

  function boot() {
    applyAuthClasses();

    // 안전장치: 무슨 일이 있어도 7초 뒤에는 로더를 끈다.
    var safety = setTimeout(hideLoader, 7000);

    var active =
      (document.getElementById("site-nav") &&
        document.getElementById("site-nav").getAttribute("data-active")) ||
      "";
    var p = global.SQTheme ? SQTheme.init() : Promise.resolve();
    p.then(function () {
      return buildNav(active);
    })
      .then(function () {
        applyPerms();
        initScrollTop();
      })
      .catch(function () {})
      .then(function () {
        clearTimeout(safety);
        hideLoader();
      });
  }

  global.SQApp = {
    esc: esc,
    root: root,
    hasPerm: hasPerm,
    applyPerms: applyPerms,
    applyAuthClasses: applyAuthClasses,
    // 하위 호환: 예전 코드가 isOwner 를 부를 수 있어 유지
    isOwner: function () {
      return hasPerm("manageSite") || hasPerm("editAny");
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
