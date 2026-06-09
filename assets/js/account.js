/* =====================================================================
 * account.js — 로그인 / 회원가입 / 프로필 화면 로직
 * ===================================================================== */
(function () {
  "use strict";

  var esc = SQApp.esc;
  var root = SQApp.root;
  var $ = function (id) {
    return document.getElementById(id);
  };
  var qs = new URLSearchParams(location.search);
  var next = qs.get("next") || root + "index.html";

  function msg(text, kind) {
    var el = $("auth-msg");
    el.textContent = text;
    el.className = "auth-msg " + (kind || "");
  }

  function renderProfile(u) {
    $("auth-box").innerHTML =
      '<div class="card profile-card">' +
      '<div class="avatar">' +
      esc((u.displayName || "?").slice(0, 1)) +
      "</div>" +
      "<h2>" +
      esc(u.displayName) +
      "</h2>" +
      '<p class="muted">@' +
      esc(u.username) +
      "</p>" +
      '<span class="role-badge">' +
      esc(SQAuth.ROLE_LABEL[u.role] || u.role) +
      "</span>" +
      '<div class="row" style="justify-content:center;margin-top:20px">' +
      '<a class="btn" href="' +
      root +
      'index.html">홈으로</a>' +
      (SQAuth.hasPerm("manageUsers")
        ? '<a class="btn" href="' + root + 'editor.html#users">회원 관리</a>'
        : "") +
      '<button class="btn btn--danger" id="logout">로그아웃</button>' +
      "</div></div>";
    $("logout").addEventListener("click", function () {
      SQAuth.logout();
      location.reload();
    });
  }

  function renderForms() {
    $("auth-box").innerHTML =
      '<div class="auth-tabs">' +
      '<button id="tab-login" class="is-on">로그인</button>' +
      '<button id="tab-signup">회원가입</button>' +
      "</div>" +
      // 로그인
      '<form class="auth-form is-on" id="form-login">' +
      '<input type="text" id="li-user" placeholder="아이디" autocomplete="username" />' +
      '<input type="password" id="li-pw" placeholder="비밀번호" autocomplete="current-password" />' +
      '<button class="btn btn--primary" type="submit">로그인</button>' +
      "</form>" +
      // 회원가입
      '<form class="auth-form" id="form-signup">' +
      '<input type="text" id="su-name" placeholder="표시 이름 (닉네임)" />' +
      '<input type="text" id="su-user" placeholder="아이디 (영문/숫자)" autocomplete="username" />' +
      '<input type="password" id="su-pw" placeholder="비밀번호 (4자 이상)" autocomplete="new-password" />' +
      '<button class="btn btn--primary" type="submit">회원가입</button>' +
      "</form>" +
      '<p class="auth-msg" id="auth-msg"></p>' +
      '<p class="hint">첫 가입자는 자동으로 <b>최고 관리자</b>가 됩니다.</p>';

    $("tab-login").addEventListener("click", function () {
      switchTab("login");
    });
    $("tab-signup").addEventListener("click", function () {
      switchTab("signup");
    });

    $("form-login").addEventListener("submit", function (e) {
      e.preventDefault();
      msg("로그인 중…");
      SQAuth.login($("li-user").value, $("li-pw").value)
        .then(function () {
          location.href = next;
        })
        .catch(function (err) {
          msg(err.message, "err");
        });
    });

    $("form-signup").addEventListener("submit", function (e) {
      e.preventDefault();
      msg("가입 중…");
      SQAuth.register($("su-user").value, $("su-pw").value, $("su-name").value)
        .then(function () {
          location.href = next;
        })
        .catch(function (err) {
          msg(err.message, "err");
        });
    });
  }

  function switchTab(which) {
    var login = which === "login";
    $("tab-login").classList.toggle("is-on", login);
    $("tab-signup").classList.toggle("is-on", !login);
    $("form-login").classList.toggle("is-on", login);
    $("form-signup").classList.toggle("is-on", !login);
    msg("");
  }

  function boot() {
    if (SQAuth.isLoggedIn()) renderProfile(SQAuth.current());
    else renderForms();
  }

  if (window.SQAuth && window.SQStore) boot();
})();
