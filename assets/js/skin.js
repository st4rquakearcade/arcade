/* =====================================================================
 * skin.js — 스킨 에디터 (주인용 설정 도구)
 * ---------------------------------------------------------------------
 *  1) 사이트   : 제목/핸들/소개/대표이미지/푸터/PIN/기본 테마
 *  2) 테마     : 프리셋 선택 + 색 직접 편집 + 커스텀 프리셋 저장/삭제
 *  3) 게시판   : 추가/수정/삭제/순서 + "전용 HTML 파일 자동 생성"
 *  4) 백업     : 전체 설정 내보내기/가져오기(JSON)
 * ===================================================================== */
(function () {
  "use strict";

  var esc = SQApp.esc;
  var root = SQApp.root;
  var $ = function (id) {
    return document.getElementById(id);
  };

  var state = {
    site: null,
    boards: [],
    themes: {}, // 빌트인 + 커스텀
    currentTheme: "graphite",
    draftVars: {} // 색 편집 작업본
  };

  var VAR_LABELS = {
    "--bg": "배경",
    "--surface": "카드 면",
    "--surface-2": "카드 면(밝게)",
    "--line": "테두리선",
    "--text": "글자",
    "--text-dim": "흐린 글자",
    "--accent": "강조"
  };
  var BOARD_TYPES = {
    intro: "대문(인트로)",
    list: "목록형",
    stream: "메모(흐름)",
    guest: "방명록",
    banner: "배너"
  };

  /* ---------- 탭 ---------- */
  function selectTab(name) {
    document.querySelectorAll(".skin-tabs button").forEach(function (x) {
      x.classList.toggle("is-on", x.dataset.tab === name);
    });
    document.querySelectorAll(".skin-panel").forEach(function (x) {
      x.classList.toggle("is-on", x.id === "panel-" + name);
    });
  }

  function bindTabs() {
    var firstVisible = null;
    document.querySelectorAll(".skin-tabs button").forEach(function (b) {
      var perm = b.getAttribute("data-perm");
      // 권한 없는 탭은 숨김
      if (perm && !SQAuth.hasPerm(perm)) {
        b.hidden = true;
        return;
      }
      if (!firstVisible) firstVisible = b.dataset.tab;
      b.addEventListener("click", function () {
        selectTab(b.dataset.tab);
      });
    });
    if (firstVisible) selectTab(firstVisible);
  }

  /* ---------- 1) 사이트 ---------- */
  function renderSite() {
    var s = state.site;
    $("s-title").value = (s.title || []).join(" / ");
    $("s-handle").value = s.handle || "";
    $("s-desc").value = s.description || "";
    $("s-image").value = s.image || "";
    $("s-footer").value = s.footer || "";
  }
  function collectSite() {
    var s = state.site;
    s.title = $("s-title").value.split("/").map(function (t) {
      return t.trim();
    }).filter(Boolean);
    s.handle = $("s-handle").value.trim();
    s.description = $("s-desc").value.trim();
    s.image = $("s-image").value.trim();
    s.footer = $("s-footer").value.trim();
    s.theme = state.currentTheme;
    return s;
  }

  /* ---------- 2) 테마 ---------- */
  function renderThemeGrid() {
    var grid = $("theme-grid");
    grid.innerHTML = Object.keys(state.themes)
      .map(function (id) {
        var t = state.themes[id];
        var v = t.vars || {};
        var bar = ["--bg", "--surface", "--line", "--text", "--accent"]
          .map(function (k) {
            return '<span style="background:' + (v[k] || "#888") + '"></span>';
          })
          .join("");
        return (
          '<button type="button" class="theme-swatch' +
          (id === state.currentTheme ? " is-on" : "") +
          '" data-theme="' +
          esc(id) +
          '"><div class="bar">' +
          bar +
          '</div><div class="nm">' +
          esc(t.name || id) +
          '</div><div class="tag">' +
          (t.builtin ? "기본" : "커스텀") +
          " · " +
          (t.mode || "dark") +
          "</div></button>"
        );
      })
      .join("");
    grid.querySelectorAll("[data-theme]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectTheme(btn.dataset.theme);
      });
    });
  }

  function selectTheme(id) {
    state.currentTheme = id;
    var t = state.themes[id];
    if (!t) return;
    state.draftVars = JSON.parse(JSON.stringify(t.vars || {}));
    $("theme-mode").value = t.mode || "dark";
    SQTheme.applyVars(state.draftVars, t.mode);
    renderThemeGrid();
    renderVarEditor();
    $("del-theme").style.display = t.builtin ? "none" : "inline-flex";
  }

  function renderVarEditor() {
    var box = $("var-editor");
    box.innerHTML = Object.keys(VAR_LABELS)
      .map(function (k) {
        var val = state.draftVars[k] || "#888888";
        return (
          '<div class="var-row"><label>' +
          esc(VAR_LABELS[k]) +
          " <span style=\"opacity:.5\">" +
          k +
          "</span></label>" +
          '<input type="color" data-var="' +
          k +
          '" value="' +
          esc(toHex(val)) +
          '" />' +
          '<input type="text" data-vartext="' +
          k +
          '" value="' +
          esc(val) +
          '" /></div>'
        );
      })
      .join("");
    box.querySelectorAll("[data-var]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var k = inp.dataset.var;
        state.draftVars[k] = inp.value;
        box.querySelector('[data-vartext="' + k + '"]').value = inp.value;
        SQTheme.applyVars(state.draftVars, $("theme-mode").value);
      });
    });
    box.querySelectorAll("[data-vartext]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var k = inp.dataset.vartext;
        state.draftVars[k] = inp.value;
        SQTheme.applyVars(state.draftVars, $("theme-mode").value);
      });
    });
  }

  function toHex(c) {
    if (/^#([0-9a-f]{6})$/i.test(c)) return c;
    if (/^#([0-9a-f]{3})$/i.test(c))
      return (
        "#" +
        c
          .slice(1)
          .split("")
          .map(function (x) {
            return x + x;
          })
          .join("")
      );
    return "#888888";
  }

  function saveCustomTheme() {
    var name = window.prompt("프리셋 이름을 입력하세요", "내 테마");
    if (!name) return;
    var id = "custom-" + SQStore.uid();
    SQStore.getCustomThemes().then(function (custom) {
      custom[id] = {
        name: name,
        mode: $("theme-mode").value,
        vars: JSON.parse(JSON.stringify(state.draftVars))
      };
      SQStore.saveCustomThemes(custom).then(function () {
        SQStore.flush("themes_custom");
        return reloadThemes(id);
      });
    });
  }

  function deleteCustomTheme() {
    var id = state.currentTheme;
    if (state.themes[id] && state.themes[id].builtin) return;
    if (!window.confirm("이 커스텀 프리셋을 삭제할까요?")) return;
    SQStore.getCustomThemes().then(function (custom) {
      delete custom[id];
      SQStore.saveCustomThemes(custom).then(function () {
        SQStore.flush("themes_custom");
        reloadThemes("graphite");
      });
    });
  }

  function reloadThemes(selectId) {
    return SQTheme.all().then(function (themes) {
      state.themes = themes;
      if (!themes[selectId]) selectId = Object.keys(themes)[0];
      selectTheme(selectId);
    });
  }

  /* ---------- 3) 게시판 ---------- */
  function renderBoards() {
    var box = $("board-list");
    box.innerHTML = state.boards
      .map(function (b, i) {
        return (
          '<div class="board-row" data-i="' +
          i +
          '">' +
          '<input class="ico" data-f="icon" value="' +
          esc(b.icon || "") +
          '" title="아이콘" />' +
          '<input data-f="name" value="' +
          esc(b.name || "") +
          '" placeholder="이름" />' +
          '<input data-f="id" value="' +
          esc(b.id || "") +
          '" placeholder="영문 id"' +
          (b.id === "home" ? " readonly" : "") +
          " />" +
          '<select data-f="type">' +
          Object.keys(BOARD_TYPES)
            .map(function (t) {
              return (
                '<option value="' +
                t +
                '"' +
                (b.type === t ? " selected" : "") +
                ">" +
                BOARD_TYPES[t] +
                "</option>"
              );
            })
            .join("") +
          "</select>" +
          '<div class="ops">' +
          '<label class="muted" style="display:flex;align-items:center;gap:3px;font-size:.7rem" title="주인/관리자만 글쓰기"><input type="checkbox" data-f="ownerOnly" style="width:auto"' +
          (b.ownerOnly ? " checked" : "") +
          ">주인만</label>" +
          '<label class="muted" style="display:flex;align-items:center;gap:3px;font-size:.7rem" title="비로그인 방문자는 열람 불가"><input type="checkbox" data-f="membersOnly" style="width:auto"' +
          (b.membersOnly ? " checked" : "") +
          ">회원전용</label>" +
          '<button class="btn btn--sm" type="button" data-up>↑</button>' +
          '<button class="btn btn--sm" type="button" data-down>↓</button>' +
          '<button class="btn btn--sm" type="button" data-gen title="전용 HTML 파일 생성">⬇HTML</button>' +
          (b.id === "home"
            ? ""
            : '<button class="btn btn--sm btn--danger" type="button" data-rm>✕</button>') +
          "</div></div>"
        );
      })
      .join("");

    box.querySelectorAll(".board-row").forEach(function (row) {
      var i = +row.dataset.i;
      row.querySelectorAll("[data-f]").forEach(function (inp) {
        inp.addEventListener("change", function () {
          var f = inp.dataset.f;
          state.boards[i][f] =
            inp.type === "checkbox" ? inp.checked : inp.value.trim();
        });
      });
      row.querySelector("[data-up]").addEventListener("click", function () {
        move(i, -1);
      });
      row.querySelector("[data-down]").addEventListener("click", function () {
        move(i, 1);
      });
      row.querySelector("[data-gen]").addEventListener("click", function () {
        downloadBoardHtml(state.boards[i]);
      });
      var rm = row.querySelector("[data-rm]");
      if (rm)
        rm.addEventListener("click", function () {
          if (!window.confirm("게시판 정의를 목록에서 지울까요? (글은 남습니다)"))
            return;
          state.boards.splice(i, 1);
          reorder();
          renderBoards();
        });
    });
  }

  function move(i, dir) {
    var j = i + dir;
    if (j < 0 || j >= state.boards.length) return;
    var tmp = state.boards[i];
    state.boards[i] = state.boards[j];
    state.boards[j] = tmp;
    reorder();
    renderBoards();
  }
  function reorder() {
    state.boards.forEach(function (b, idx) {
      b.order = idx;
    });
  }

  function addBoard() {
    var name = $("nb-name").value.trim();
    var id = $("nb-id").value.trim();
    if (!name || !id) {
      window.alert("이름과 영문 id를 입력하세요.");
      return;
    }
    if (
      state.boards.some(function (b) {
        return b.id === id;
      })
    ) {
      window.alert("이미 같은 id의 게시판이 있습니다.");
      return;
    }
    var board = {
      id: id,
      name: name,
      type: $("nb-type").value,
      icon: $("nb-icon").value.trim() || "·",
      desc: "",
      ownerOnly: $("nb-owner").checked,
      membersOnly: $("nb-members").checked,
      order: state.boards.length
    };
    state.boards.push(board);
    renderBoards();
    $("nb-name").value = $("nb-id").value = $("nb-icon").value = "";
    // 요구사항: 게시판을 만들면 연동해 전용 HTML 파일을 자동 제작
    SQStore.saveBoards(state.boards).then(function () {
      SQStore.flush("boards");
      downloadBoardHtml(board);
      toast("게시판 추가됨 — 전용 HTML 파일을 내려받았습니다.");
    });
  }

  /* ---------- 보드 전용 HTML 생성기 ---------- */
  function downloadBoardHtml(board) {
    var html = genBoardHtml(board);
    var blob = new Blob([html], { type: "text/html;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "board-" + board.id + ".html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 1000);
  }

  // 용도(type)에 맞춘 안내 코드를 자동으로 끼워 넣는다.
  function typeHint(board) {
    var map = {
      list: "제목·내용이 있는 글을 카드 목록으로 보여줍니다.",
      stream: "짧은 메모를 카드 흐름으로 보여줍니다.",
      guest: "방문자가 인사를 남기는 방명록입니다.",
      banner: "링크 배너를 격자로 보여줍니다.",
      intro: "사이트 첫 화면(대문)입니다."
    };
    return map[board.type] || "";
  }

  function genBoardHtml(board) {
    var b = board;
    return (
      "<!DOCTYPE html>\n" +
      '<html lang="ko" data-root="">\n' +
      "<head>\n" +
      '  <meta charset="UTF-8" />\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n' +
      "  <title>" +
      esc(b.name) +
      " — STARQUAKE ARCADE</title>\n" +
      "\n" +
      "  <!-- ===== 이 파일은 스킨 에디터가 자동 생성했습니다 =====\n" +
      "       게시판 종류: " +
      (BOARD_TYPES[b.type] || b.type) +
      "\n       설명: " +
      typeHint(b) +
      "\n       · 아래 data-board 값이 이 페이지가 보여줄 게시판입니다.\n" +
      "       · 내용/디자인은 글쓰기 에디터와 스킨 에디터에서 바꾸세요.\n" +
      "       · 직접 고치고 싶다면 아래 '여기부터 수정' 영역만 만지면 됩니다. -->\n" +
      "\n" +
      '  <link rel="stylesheet" href="assets/css/tokens.css" />\n' +
      '  <link rel="stylesheet" href="assets/css/base.css" />\n' +
      '  <link rel="stylesheet" href="assets/css/layout.css" />\n' +
      '  <link rel="stylesheet" href="assets/css/board.css" />\n' +
      "\n" +
      '  <script defer src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>\n' +
      '  <script defer src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>\n' +
      '  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>\n' +
      "\n" +
      "  <!-- 이 페이지가 보여줄 게시판 id -->\n" +
      "  <script>window.SQ_BOARD = " +
      JSON.stringify(b.id) +
      ";</script>\n" +
      '  <script defer src="assets/js/firebase-config.js"></script>\n' +
      '  <script defer src="assets/js/firebase.js"></script>\n' +
      '  <script defer src="assets/js/store.js"></script>\n' +
      '  <script defer src="assets/js/auth.js"></script>\n' +
      '  <script defer src="assets/js/theme.js"></script>\n' +
      '  <script defer src="assets/js/app.js"></script>\n' +
      '  <script defer src="assets/js/board.js"></script>\n' +
      "</head>\n" +
      "<body>\n" +
      '  <div id="loader"><span class="dot"></span></div>\n' +
      '  <nav id="site-nav" class="site-nav" data-active="' +
      esc(b.id) +
      '" aria-label="주 메뉴"></nav>\n' +
      "\n" +
      '  <main class="shell">\n' +
      "    <!-- ===== 여기부터 수정: 이 게시판만의 안내 문구를 자유롭게 ===== -->\n" +
      '    <!-- <p class="muted">' +
      esc(b.name) +
      " 게시판입니다.</p> -->\n" +
      "    <!-- ===== 여기까지 수정 ===== -->\n" +
      '    <div id="board-root"></div>\n' +
      "  </main>\n" +
      '  <button type="button" class="scroll-top" id="scroll-top" aria-label="맨 위로">↑</button>\n' +
      "</body>\n" +
      "</html>\n"
    );
  }

  /* ---------- 회원 관리 ---------- */
  function renderUsers() {
    var box = $("user-list");
    if (!box || !SQAuth.hasPerm("manageUsers")) return;
    SQAuth.listUsers().then(function (users) {
      var me = SQAuth.current();
      users.sort(function (a, b) {
        return SQAuth.ROLES.indexOf(a.role) - SQAuth.ROLES.indexOf(b.role);
      });
      box.innerHTML = users
        .map(function (u) {
          return (
            '<div class="board-row" data-uid="' +
            esc(u.id) +
            '">' +
            '<div class="ico">' +
            esc((u.displayName || "?").slice(0, 1)) +
            "</div>" +
            "<div><b>" +
            esc(u.displayName) +
            "</b><br><span class=\"muted\" style=\"font-size:.78rem\">@" +
            esc(u.username) +
            (u.id === me.id ? " (나)" : "") +
            "</span></div>" +
            '<select data-role>' +
            SQAuth.ROLES.map(function (r) {
              return (
                '<option value="' +
                r +
                '"' +
                (u.role === r ? " selected" : "") +
                ">" +
                SQAuth.ROLE_LABEL[r] +
                "</option>"
              );
            }).join("") +
            "</select>" +
            "<div></div>" +
            '<div class="ops"><button class="btn btn--sm btn--danger" type="button" data-rmuser>삭제</button></div>' +
            "</div>"
          );
        })
        .join("");

      box.querySelectorAll(".board-row").forEach(function (row) {
        var uid = row.dataset.uid;
        row.querySelector("[data-role]").addEventListener("change", function () {
          var v = this.value;
          SQAuth.setRole(uid, v)
            .then(function () {
              toast("등급이 변경되었습니다.");
              SQApp.applyAuthClasses();
            })
            .catch(function (e) {
              window.alert(e.message);
              renderUsers();
            });
        });
        row.querySelector("[data-rmuser]").addEventListener("click", function () {
          if (!window.confirm("이 회원을 삭제할까요?")) return;
          SQAuth.removeUser(uid)
            .then(function () {
              renderUsers();
            })
            .catch(function (e) {
              window.alert(e.message);
            });
        });
      });
    });
  }

  /* ---------- 4) 백업 ---------- */
  function exportAll() {
    Promise.all([
      SQStore.getSite(),
      SQStore.getBoards(),
      SQStore.getCustomThemes()
    ]).then(function (r) {
      var data = { site: r[0], boards: r[1], themes_custom: r[2] };
      var blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
      });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "arcade-preset.json";
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
      }, 1000);
    });
  }
  function importAll() {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = function () {
      var f = input.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var d = JSON.parse(reader.result);
          var jobs = [];
          if (d.site) jobs.push(SQStore.saveSite(d.site));
          if (d.boards) jobs.push(SQStore.saveBoards(d.boards));
          if (d.themes_custom)
            jobs.push(SQStore.saveCustomThemes(d.themes_custom));
          Promise.all(jobs).then(function () {
            SQStore.flush();
            toast("가져오기 완료 — 새로고침하세요.");
          });
        } catch (e) {
          window.alert("올바른 프리셋 파일이 아닙니다.");
        }
      };
      reader.readAsText(f);
    };
    input.click();
  }

  /* ---------- 저장 ---------- */
  function saveEverything() {
    reorder();
    var jobs = [SQStore.saveBoards(state.boards)];
    // 사이트/테마 변경 저장은 사이트 관리 권한이 있을 때만
    if (SQAuth.hasPerm("manageSite")) jobs.push(SQStore.saveSite(collectSite()));
    Promise.all(jobs).then(function () {
      SQStore.flush();
      if (SQAuth.hasPerm("manageSite")) SQTheme.apply(state.currentTheme);
      toast("저장되었습니다.");
    });
  }

  function toast(msg) {
    var el = $("skin-status");
    el.textContent = msg;
    setTimeout(function () {
      if (el.textContent === msg) el.textContent = "";
    }, 4000);
  }

  /* ---------- 부트 ---------- */
  function boot() {
    // 접근 권한: 게시판 관리 권한(부관리자 이상)이 있어야 에디터 진입.
    if (!SQAuth.hasPerm("manageBoards")) {
      document.querySelector(".shell").innerHTML =
        '<div class="empty">스킨 에디터는 관리자만 사용할 수 있습니다.<br><br>' +
        '<a class="btn" href="' +
        root +
        'account.html?next=' +
        encodeURIComponent(location.pathname) +
        '">로그인 하기</a></div>';
      return;
    }

    bindTabs();
    $("btn-save-all").addEventListener("click", saveEverything);
    $("save-theme").addEventListener("click", saveCustomTheme);
    $("del-theme").addEventListener("click", deleteCustomTheme);
    $("set-site-theme").addEventListener("click", function () {
      state.site.theme = state.currentTheme;
      toast("기본 테마로 지정됨 (저장을 눌러 적용)");
    });
    $("add-board").addEventListener("click", addBoard);
    $("export-all").addEventListener("click", exportAll);
    $("import-all").addEventListener("click", importAll);
    $("nb-type").innerHTML = Object.keys(BOARD_TYPES)
      .filter(function (t) {
        return t !== "intro";
      })
      .map(function (t) {
        return '<option value="' + t + '">' + BOARD_TYPES[t] + "</option>";
      })
      .join("");

    Promise.all([SQStore.getSite(), SQStore.getBoards(), SQTheme.all()]).then(
      function (r) {
        state.site = r[0] || {};
        state.boards = r[1] || [];
        state.themes = r[2] || {};
        state.currentTheme = state.site.theme || Object.keys(state.themes)[0];
        renderSite();
        renderThemeGrid();
        selectTheme(state.currentTheme);
        renderBoards();
        renderUsers();
        // account.html 등에서 #users 로 들어오면 회원 탭 열기
        if (location.hash === "#users") {
          var ub = document.querySelector('.skin-tabs [data-tab="users"]');
          if (ub) ub.click();
        }
      }
    );
  }

  if (window.SQStore) boot();
})();
