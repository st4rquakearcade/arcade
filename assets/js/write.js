/* =====================================================================
 * write.js — 리치 텍스트 글쓰기 에디터
 * ---------------------------------------------------------------------
 * 기능: 서식(굵게/기울임/색/정렬/목록/인용/코드/표/링크/이미지/구분선),
 *       소스(HTML) 편집, 미리보기, 임시저장(자동), 비밀글, 고정, 수정/삭제
 * 서식은 document.execCommand 로 처리합니다(모든 브라우저 지원, 단순함).
 * ===================================================================== */
(function () {
  "use strict";

  var esc = SQApp.esc;
  var root = SQApp.root;
  var qs = new URLSearchParams(location.search);
  var boardId = qs.get("board") || "free";
  var editId = qs.get("id") || "";

  var $ = function (id) {
    return document.getElementById(id);
  };
  var body = $("editor-body");
  var source = $("editor-source");
  var preview = $("preview");
  var status = $("save-status");

  var draftKey = "sq:draft:" + boardId + ":" + (editId || "new");
  var sourceMode = false;
  var previewMode = false;

  /* ---------- 서식 명령 ---------- */
  function exec(cmd, val) {
    body.focus();
    document.execCommand(cmd, false, val || null);
    refreshButtons();
    scheduleDraft();
  }

  function format(tag) {
    // p, h1~h3, blockquote, pre
    exec("formatBlock", tag);
  }

  function insertHTML(html) {
    body.focus();
    document.execCommand("insertHTML", false, html);
    scheduleDraft();
  }

  function makeLink() {
    var url = window.prompt("링크 주소(URL)를 입력하세요", "https://");
    if (url) exec("createLink", url);
  }

  function makeTable() {
    var r = parseInt(window.prompt("행 수", "2"), 10);
    var c = parseInt(window.prompt("열 수", "2"), 10);
    if (!r || !c) return;
    var html = "<table>";
    for (var i = 0; i < r; i++) {
      html += "<tr>";
      for (var j = 0; j < c; j++) html += "<td>&nbsp;</td>";
      html += "</tr>";
    }
    html += "</table><p><br></p>";
    insertHTML(html);
  }

  function pickImage() {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = function () {
      var file = input.files[0];
      if (!file) return;
      status.textContent = "이미지 변환 중…";
      SQImg.compress(file, { maxW: 1400, quality: 0.82 })
        .then(function (res) {
          insertHTML('<img src="' + res.dataURL + '" alt="" />');
          status.textContent =
            "이미지 삽입됨 (" + SQImg.fmtBytes(res.bytes) + ")";
        })
        .catch(function (e) {
          status.textContent = "이미지 오류: " + e.message;
        });
    };
    input.click();
  }

  /* ---------- 버튼 상태 동기화 ---------- */
  var stateBtns = ["bold", "italic", "underline", "strikeThrough"];
  function refreshButtons() {
    stateBtns.forEach(function (cmd) {
      var btn = document.querySelector('[data-cmd="' + cmd + '"]');
      if (!btn) return;
      try {
        btn.classList.toggle("is-on", document.queryCommandState(cmd));
      } catch (e) {}
    });
  }

  /* ---------- 툴바 바인딩 ---------- */
  function bindToolbar() {
    document.querySelectorAll("[data-cmd]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        exec(btn.getAttribute("data-cmd"), btn.getAttribute("data-val"));
      });
    });
    document.querySelectorAll("[data-block]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        format(btn.getAttribute("data-block"));
      });
    });
    $("tb-format").addEventListener("change", function () {
      if (this.value) format(this.value);
      this.value = "";
    });
    $("tb-size").addEventListener("change", function () {
      if (this.value) exec("fontSize", this.value);
      this.value = "";
    });
    $("tb-fore").addEventListener("input", function () {
      exec("foreColor", this.value);
    });
    $("tb-back").addEventListener("input", function () {
      body.focus();
      // 형광펜: hiliteColor 미지원 브라우저는 backColor 로 대체
      if (!document.execCommand("hiliteColor", false, this.value)) {
        document.execCommand("backColor", false, this.value);
      }
      scheduleDraft();
    });
    $("tb-link").addEventListener("click", makeLink);
    $("tb-image").addEventListener("click", pickImage);
    $("tb-table").addEventListener("click", makeTable);
    $("tb-clear").addEventListener("click", function () {
      exec("removeFormat");
      format("p");
    });
    body.addEventListener("keyup", refreshButtons);
    body.addEventListener("mouseup", refreshButtons);
    body.addEventListener("input", scheduleDraft);
  }

  /* ---------- 소스 / 미리보기 토글 ---------- */
  function toggleSource() {
    sourceMode = !sourceMode;
    if (sourceMode) {
      source.value = body.innerHTML;
      source.style.display = "block";
      body.style.display = "none";
      $("tb-source").classList.add("is-on");
    } else {
      body.innerHTML = source.value;
      source.style.display = "none";
      body.style.display = "block";
      $("tb-source").classList.remove("is-on");
    }
  }

  function togglePreview() {
    previewMode = !previewMode;
    if (previewMode) {
      preview.innerHTML = getHTML();
      preview.style.display = "block";
      $("btn-preview").textContent = "미리보기 닫기";
    } else {
      preview.style.display = "none";
      $("btn-preview").textContent = "미리보기";
    }
  }

  function getHTML() {
    return sourceMode ? source.value : body.innerHTML;
  }

  /* ---------- 임시저장 ---------- */
  var draftTimer = null;
  function scheduleDraft() {
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 800);
  }
  function collect() {
    return {
      board: $("ed-board").value,
      title: $("ed-title").value,
      author: $("ed-author").value,
      tags: $("ed-tags").value,
      html: getHTML(),
      pinned: $("ed-pinned").checked,
      secret: $("ed-secret").checked,
      password: $("ed-password").value
    };
  }
  function saveDraft() {
    try {
      localStorage.setItem(draftKey, JSON.stringify(collect()));
      status.textContent = "임시저장됨 · " + new Date().toLocaleTimeString();
    } catch (e) {}
  }
  function loadDraft() {
    try {
      var raw = localStorage.getItem(draftKey);
      if (!raw) return false;
      if (!window.confirm("임시저장된 글이 있습니다. 불러올까요?")) return false;
      var d = JSON.parse(raw);
      fill(d);
      return true;
    } catch (e) {
      return false;
    }
  }
  function clearDraft() {
    try {
      localStorage.removeItem(draftKey);
    } catch (e) {}
  }

  function fill(d) {
    $("ed-board").value = d.board || boardId;
    $("ed-title").value = d.title || "";
    $("ed-author").value = d.author || "";
    $("ed-tags").value = Array.isArray(d.tags)
      ? d.tags.join(", ")
      : d.tags || "";
    body.innerHTML = d.html || "";
    $("ed-pinned").checked = !!d.pinned;
    $("ed-secret").checked = !!d.secret;
    $("ed-password").value = d.password || "";
    togglePwVisibility();
  }

  function togglePwVisibility() {
    $("pw-wrap").style.display = $("ed-secret").checked ? "inline-flex" : "none";
  }

  /* ---------- 저장 / 삭제 ---------- */
  function save() {
    var c = collect();
    if (!c.title && !c.html.trim()) {
      window.alert("제목이나 내용을 입력하세요.");
      return;
    }
    var post = {
      board: c.board,
      title: c.title.trim(),
      author: c.author.trim() || "주인",
      html: c.html,
      tags: c.tags
        ? c.tags.split(",").map(function (t) {
            return t.trim();
          }).filter(Boolean)
        : [],
      pinned: c.pinned,
      secret: c.secret,
      password: c.secret ? c.password : ""
    };
    if (editId) post.id = editId;
    status.textContent = "저장 중…";
    SQStore.savePost(post).then(function (saved) {
      clearDraft();
      SQStore.flush("posts");
      location.href =
        root +
        "board.html?board=" +
        encodeURIComponent(saved.board) +
        "&id=" +
        encodeURIComponent(saved.id);
    });
  }

  function del() {
    if (!editId) return;
    if (!window.confirm("정말 삭제할까요?")) return;
    SQStore.removePost(editId).then(function () {
      clearDraft();
      SQStore.flush("posts");
      location.href = root + "board.html?board=" + encodeURIComponent(boardId);
    });
  }

  /* ---------- 초기화 ---------- */
  function boot() {
    SQStore.getBoards().then(function (boards) {
      var sel = $("ed-board");
      sel.innerHTML = boards
        .filter(function (b) {
          return b.id !== "home";
        })
        .map(function (b) {
          return (
            '<option value="' +
            esc(b.id) +
            '"' +
            (b.id === boardId ? " selected" : "") +
            ">" +
            esc(b.name) +
            "</option>"
          );
        })
        .join("");
    });

    bindToolbar();
    $("tb-source").addEventListener("click", toggleSource);
    $("btn-preview").addEventListener("click", togglePreview);
    $("btn-save").addEventListener("click", save);
    $("btn-delete").addEventListener("click", del);
    $("ed-secret").addEventListener("change", function () {
      togglePwVisibility();
      scheduleDraft();
    });
    [$("ed-title"), $("ed-author"), $("ed-tags"), $("ed-password")].forEach(
      function (el) {
        el.addEventListener("input", scheduleDraft);
      }
    );

    if (editId) {
      $("btn-delete").style.display = "inline-flex";
      SQStore.getPost(editId).then(function (p) {
        if (!p) {
          status.textContent = "글을 찾지 못했습니다.";
          return;
        }
        fill({
          board: p.board,
          title: p.title,
          author: p.author,
          tags: p.tags,
          html: p.html,
          pinned: p.pinned,
          secret: p.secret,
          password: p.password
        });
        loadDraft(); // 수정 중이던 임시본이 있으면 덮어쓰기 여부 확인
      });
    } else {
      loadDraft();
      togglePwVisibility();
    }
  }

  if (window.SQStore) boot();
})();
