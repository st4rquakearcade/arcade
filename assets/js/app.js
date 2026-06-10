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
    b.classList.toggle("role-visitor", !loggedIn);
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

  /* 아이콘 렌더(이름이면 SVG, 아니면 텍스트) */
  function ico(name) {
    if (global.SQIcons && SQIcons.has(name)) return SQIcons.svg(name);
    return esc(name || "·");
  }

  /* ---------- 좌측 사이드바 ---------- */
  function navLink(href, iconName, label, active, extraCls) {
    return (
      '<a href="' +
      esc(href) +
      '"' +
      (active ? ' class="is-active ' + (extraCls || "") + '"' : extraCls ? ' class="' + extraCls + '"' : "") +
      '><span class="nav-ico">' +
      ico(iconName) +
      "</span>" +
      esc(label) +
      "</a>"
    );
  }

  function buildNav(active) {
    var mount = document.getElementById("site-nav");
    if (!mount) return Promise.resolve();
    return Promise.all([SQStore.getBoards(), SQStore.getSite()]).then(function (
      res
    ) {
      var boards = res[0],
        site = res[1] || {};
      var brand = Array.isArray(site.title)
        ? site.title.join(" ")
        : site.title || "ARCADE";

      var links = boards
        .map(function (b) {
          var href =
            b.id === "home"
              ? root + "index.html"
              : root + "board.html?board=" + encodeURIComponent(b.id);
          return navLink(href, b.icon, b.name, b.id === active);
        })
        .join("");

      mount.innerHTML =
        '<a class="nav-brand" href="' +
        root +
        'index.html">' +
        esc(brand) +
        "</a>" +
        '<div><p class="nav-section">카테고리</p><nav class="nav-links">' +
        links +
        "</nav></div>" +
        navTools();

      bindNavTools();
    });
  }

  // 카테고리 아래: 스킨 · 글쓰기 · 회원 · 로그인
  function navTools() {
    var loggedIn = auth() && SQAuth.isLoggedIn();
    var t = '<div class="nav-tools">';
    if (loggedIn) {
      var u = SQAuth.current();
      if (hasPerm("manageSite"))
        t += navLink(root + "editor.html", "palette", "스킨");
      if (hasPerm("writeMember"))
        t += navLink(root + "write.html", "pencil", "글쓰기");
      if (hasPerm("manageUsers"))
        t += navLink(root + "editor.html#users", "users", "회원");
      t += navLink(root + "account.html", "user", u.displayName, false, "nav-user");
      t +=
        '<button type="button" id="logout-btn" class="nav-logout"><span class="nav-ico">' +
        ico("lock") +
        "</span>로그아웃</button>";
    } else {
      t += navLink(root + "account.html", "user", "로그인");
    }
    t += "</div>";
    return t;
  }

  function bindNavTools() {
    var out = document.getElementById("logout-btn");
    if (out)
      out.addEventListener("click", function () {
        SQAuth.logout();
        location.reload();
      });
  }

  /* 모바일 사이드바 토글 + 스크림 주입 */
  function initNavToggle() {
    if (document.getElementById("nav-toggle")) return;
    var btn = document.createElement("button");
    btn.id = "nav-toggle";
    btn.className = "nav-toggle";
    btn.setAttribute("aria-label", "메뉴");
    btn.innerHTML = "☰";
    var scrim = document.createElement("div");
    scrim.className = "nav-scrim";
    document.body.appendChild(btn);
    document.body.appendChild(scrim);
    btn.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
    });
    scrim.addEventListener("click", function () {
      document.body.classList.remove("nav-open");
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
        initNavToggle();
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
