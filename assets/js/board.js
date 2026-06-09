/* =====================================================================
 * board.js — 게시판 렌더링
 * ---------------------------------------------------------------------
 *  ?board=<id>        → 목록 보기 (타입별 레이아웃)
 *  ?board=<id>&id=<x> → 글 하나 보기 (비밀글/수정/삭제 처리)
 * ===================================================================== */
(function () {
  "use strict";

  var esc = SQApp.esc;
  var root = SQApp.root;
  var qs = new URLSearchParams(location.search);
  // 쿼리(?board=)가 우선, 없으면 생성된 전용 파일이 심어둔 window.SQ_BOARD 사용
  var boardId = qs.get("board") || window.SQ_BOARD || "notice";
  var postId = qs.get("id") || "";
  var mount = document.getElementById("board-root");
  var nav = document.getElementById("site-nav");
  if (nav) nav.setAttribute("data-active", boardId);

  function fmt(ts) {
    if (!ts) return "";
    var d = new Date(ts);
    return (
      d.getFullYear() +
      "." +
      ("0" + (d.getMonth() + 1)).slice(-2) +
      "." +
      ("0" + d.getDate()).slice(-2)
    );
  }
  function strip(html, n) {
    var d = document.createElement("div");
    d.innerHTML = html || "";
    return (d.textContent || "").trim().slice(0, n || 120);
  }

  function canWrite(board) {
    return !board.ownerOnly || SQApp.isOwner();
  }

  /* ---------------- 목록 ---------------- */
  function renderList(board, posts) {
    var head =
      '<div class="board-head"><div>' +
      '<p class="label">' +
      esc((board.id || "").toUpperCase()) +
      "</p><h1>" +
      esc(board.name) +
      "</h1>" +
      '<p class="muted">' +
      esc(board.desc || "") +
      "</p></div>" +
      (canWrite(board)
        ? '<a class="btn btn--primary' +
          (board.ownerOnly ? " owner-only" : "") +
          '" href="' +
          root +
          "write.html?board=" +
          encodeURIComponent(board.id) +
          '">＋ 글쓰기</a>'
        : "") +
      "</div>";

    var body;
    if (board.type === "banner") body = renderBanner(board, posts);
    else if (board.type === "guest") body = renderGuest(board, posts);
    else if (board.type === "stream") body = renderStream(board, posts);
    else body = renderRows(board, posts);

    mount.innerHTML = head + body;

    if (board.type === "guest") bindGuestForm(board);
    animate();
  }

  function postLink(board, p, inner) {
    return (
      '<a href="' +
      root +
      "board.html?board=" +
      encodeURIComponent(board.id) +
      "&id=" +
      encodeURIComponent(p.id) +
      '">' +
      inner +
      "</a>"
    );
  }

  function secretTitle(p) {
    if (p.secret && !SQApp.isOwner())
      return "🔒 비밀글";
    return esc(p.title || strip(p.html, 40) || "(제목 없음)");
  }

  function renderRows(board, posts) {
    if (!posts.length) return emptyBox(board);
    return (
      '<div class="list-stack" data-stagger>' +
      posts
        .map(function (p) {
          return (
            '<article class="card post-item" data-anim>' +
            postLink(
              board,
              p,
              "<h3>" +
                (p.pinned ? "📌 " : "") +
                secretTitle(p) +
                "</h3>" +
                '<div class="meta"><span>' +
                esc(p.author || "익명") +
                "</span><span>" +
                fmt(p.createdAt) +
                "</span></div>" +
                (p.secret && !SQApp.isOwner()
                  ? ""
                  : '<p class="excerpt">' + esc(strip(p.html)) + "</p>")
            ) +
            "</article>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderStream(board, posts) {
    if (!posts.length) return emptyBox(board);
    return (
      '<div class="stream-grid" data-stagger>' +
      posts
        .map(function (p) {
          var body =
            p.secret && !SQApp.isOwner()
              ? "🔒 비밀 메모"
              : p.html || "";
          return (
            '<article class="card" data-anim>' +
            (p.title ? "<h3>" + secretTitle(p) + "</h3>" : "") +
            '<div class="stream-body">' +
            body +
            "</div>" +
            '<div class="meta muted" style="font-size:.74rem;margin-top:8px">' +
            postLink(board, p, fmt(p.createdAt) + " · 열기") +
            "</div></article>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderBanner(board, posts) {
    if (!posts.length) return emptyBox(board);
    return (
      '<div class="banner-grid" data-stagger>' +
      posts
        .map(function (p) {
          var inner =
            (p.image ? '<img src="' + esc(p.image) + '" alt="" />' : "") +
            '<span class="cap">' +
            esc(p.title || "배너") +
            "</span>";
          return p.link
            ? '<a class="card banner" data-anim target="_blank" rel="noopener" href="' +
                esc(p.link) +
                '">' +
                inner +
                "</a>"
            : '<div class="card banner" data-anim>' + inner + "</div>";
        })
        .join("") +
      "</div>"
    );
  }

  function renderGuest(board, posts) {
    var form =
      '<form class="guest-form card" id="guest-form">' +
      '<div class="row"><input type="text" id="g-name" placeholder="이름 (선택)" style="max-width:200px" /></div>' +
      '<textarea id="g-msg" placeholder="인사를 남겨주세요" required></textarea>' +
      '<label class="row" style="margin:0"><input type="checkbox" id="g-secret" style="width:auto" /> 비밀로 남기기</label>' +
      '<div class="row spread"><span class="muted" id="g-status"></span>' +
      '<button class="btn btn--primary" type="submit">남기기</button></div>' +
      "</form>";
    var list = posts.length
      ? '<div class="guest-list" data-stagger>' +
        posts
          .map(function (p) {
            var msg =
              p.secret && !SQApp.isOwner()
                ? '<span class="muted">🔒 비밀 방명록</span>'
                : esc(strip(p.html, 500));
            return (
              '<article class="card guest-entry" data-anim>' +
              '<div class="spread row"><span class="who">' +
              esc(p.author || "익명") +
              '</span><span class="muted" style="font-size:.76rem">' +
              fmt(p.createdAt) +
              "</span></div><p style=\"margin:8px 0 0\">" +
              msg +
              "</p>" +
              ownerBtns(p) +
              "</article>"
            );
          })
          .join("") +
        "</div>"
      : emptyBox(board);
    return form + list;
  }

  function ownerBtns(p) {
    return (
      '<div class="row owner-only" style="margin-top:10px">' +
      '<button class="btn btn--sm btn--danger" data-del="' +
      esc(p.id) +
      '">삭제</button></div>'
    );
  }

  function emptyBox(board) {
    return '<div class="empty">아직 글이 없습니다.</div>';
  }

  function bindGuestForm(board) {
    var form = document.getElementById("guest-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = document.getElementById("g-msg").value.trim();
      if (!msg) return;
      var status = document.getElementById("g-status");
      status.textContent = "남기는 중…";
      SQStore.savePost({
        board: board.id,
        title: "",
        html: "<p>" + esc(msg).replace(/\n/g, "<br>") + "</p>",
        author: document.getElementById("g-name").value.trim() || "익명",
        secret: document.getElementById("g-secret").checked,
        tags: []
      }).then(function () {
        SQStore.flush("posts");
        location.reload();
      });
    });
    bindDelete(board);
  }

  function bindDelete(board) {
    mount.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!window.confirm("정말 삭제할까요?")) return;
        SQStore.removePost(btn.getAttribute("data-del")).then(function () {
          SQStore.flush("posts");
          location.reload();
        });
      });
    });
  }

  /* ---------------- 글 하나 보기 ---------------- */
  function renderView(board, p) {
    if (!p) {
      mount.innerHTML = '<div class="empty">글을 찾을 수 없습니다.</div>';
      return;
    }
    // 비밀글 잠금
    if (p.secret && !SQApp.isOwner()) {
      var pw = window.prompt("비밀글입니다. 비밀번호를 입력하세요.");
      if (pw == null || pw !== (p.password || "")) {
        mount.innerHTML =
          '<div class="empty">비밀번호가 일치하지 않습니다. <a href="' +
          root +
          "board.html?board=" +
          encodeURIComponent(board.id) +
          '">목록으로</a></div>';
        return;
      }
    }

    var tags = (p.tags || [])
      .map(function (t) {
        return '<span class="chip">#' + esc(t) + "</span>";
      })
      .join("");

    mount.innerHTML =
      '<article class="article" data-anim>' +
      '<a class="muted" href="' +
      root +
      "board.html?board=" +
      encodeURIComponent(board.id) +
      '">← ' +
      esc(board.name) +
      "</a>" +
      '<header class="article-head">' +
      "<h1>" +
      (p.pinned ? "📌 " : "") +
      esc(p.title || "(제목 없음)") +
      "</h1>" +
      '<div class="article-meta"><span>' +
      esc(p.author || "익명") +
      "</span><span>" +
      fmt(p.createdAt) +
      "</span>" +
      (p.updatedAt && p.updatedAt !== p.createdAt
        ? "<span>(수정 " + fmt(p.updatedAt) + ")</span>"
        : "") +
      "</div>" +
      (tags ? '<div class="tags">' + tags + "</div>" : "") +
      "</header>" +
      '<div class="article-body">' +
      (p.html || "") +
      "</div>" +
      '<div class="article-actions owner-only">' +
      '<a class="btn btn--sm" href="' +
      root +
      "write.html?board=" +
      encodeURIComponent(board.id) +
      "&id=" +
      encodeURIComponent(p.id) +
      '">수정</a>' +
      '<button class="btn btn--sm btn--danger" data-del="' +
      esc(p.id) +
      '">삭제</button>' +
      "</div>" +
      "</article>";

    mount.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!window.confirm("정말 삭제할까요?")) return;
        SQStore.removePost(p.id).then(function () {
          SQStore.flush("posts");
          location.href =
            root + "board.html?board=" + encodeURIComponent(board.id);
        });
      });
    });
    animate();
  }

  function animate() {
    if (!window.gsap) return;
    var items = mount.querySelectorAll("[data-anim]");
    gsap.from(items, {
      opacity: 0,
      y: 24,
      duration: 0.6,
      stagger: 0.06,
      ease: "power3.out"
    });
  }

  /* ---------------- 부트 ---------------- */
  SQStore.getBoard(boardId).then(function (board) {
    if (!board) {
      mount.innerHTML = '<div class="empty">없는 게시판입니다.</div>';
      return;
    }
    document.title = board.name + " — STARQUAKE ARCADE";
    if (postId) {
      SQStore.getPost(postId).then(function (p) {
        renderView(board, p);
      });
    } else {
      SQStore.getPosts(boardId).then(function (posts) {
        renderList(board, posts);
        bindDelete(board);
      });
    }
  });
})();
