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
    if (!window.SQAuth || !SQAuth.isLoggedIn()) return false;
    if (board.type === "guest") return false; // 방명록은 아래 폼으로 작성
    return board.ownerOnly
      ? SQAuth.hasPerm("writeAny")
      : SQAuth.hasPerm("writeMember");
  }

  function isOwnPost(p) {
    var me = window.SQAuth && SQAuth.current();
    return !!(me && p.authorId && p.authorId === me.id);
  }
  function canEdit(p) {
    if (!window.SQAuth) return false;
    return SQAuth.hasPerm("editAny") || (isOwnPost(p) && SQAuth.hasPerm("editOwn"));
  }
  function canDelete(p) {
    if (!window.SQAuth) return false;
    return (
      SQAuth.hasPerm("deleteAny") || (isOwnPost(p) && SQAuth.hasPerm("deleteOwn"))
    );
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
        ? '<a class="btn btn--primary" href="' +
          root +
          "write.html?board=" +
          encodeURIComponent(board.id) +
          '">＋ 글쓰기</a>'
        : "") +
      "</div>";

    mount.innerHTML = head + bodyFor(board, posts);

    if (board.type === "guest") bindGuestForm(board);
    if (board.type === "faq") bindFaq();
    reveal();
  }

  /* 타입 + 보기 형태(view)에 따라 목록 본문을 고른다 */
  function bodyFor(board, posts) {
    if (board.type === "banner") return renderBanner(board, posts);
    if (board.type === "guest") return renderGuest(board, posts);
    if (board.type === "faq") return renderFaq(board, posts);
    if (!posts.length) return emptyBox(board);

    var view =
      board.view ||
      (board.type === "gallery"
        ? "grid"
        : board.type === "stream"
        ? "compact"
        : "cards");
    if (view === "compact") return renderCompact(board, posts);
    if (view === "magazine") return renderMagazine(board, posts);
    if (view === "grid") return renderGrid(board, posts);
    return renderCards(board, posts);
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

  function firstImg(html) {
    var m = /<img[^>]+src=["']([^"']+)["']/i.exec(html || "");
    return m ? m[1] : "";
  }
  function isLocked(p) {
    return p.secret && !SQApp.isOwner();
  }
  function meta(p) {
    return (
      '<div class="meta"><span>' +
      esc(p.author || "익명") +
      "</span><span>" +
      fmt(p.createdAt) +
      "</span></div>"
    );
  }

  /* 보기: 카드 */
  function renderCards(board, posts) {
    return (
      '<div class="list-cards">' +
      posts
        .map(function (p) {
          return (
            '<article class="card post-item" data-reveal>' +
            postLink(
              board,
              p,
              "<h3>" + (p.pinned ? "📌 " : "") + secretTitle(p) + "</h3>" +
                meta(p) +
                (isLocked(p)
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

  /* 보기: 조밀한 목록 */
  function renderCompact(board, posts) {
    return (
      '<div class="list-compact" data-reveal>' +
      posts
        .map(function (p) {
          return postLink(
            board,
            p,
            '<span class="t">' +
              (p.pinned ? "📌 " : "") +
              secretTitle(p) +
              "</span>" +
              '<span class="d">' +
              esc(p.author || "익명") +
              " · " +
              fmt(p.createdAt) +
              "</span>"
          ).replace('<a ', '<a class="row-line" ');
        })
        .join("") +
      "</div>"
    );
  }

  /* 보기: 매거진(썸네일 + 발췌) */
  function renderMagazine(board, posts) {
    return (
      '<div class="list-mag">' +
      posts
        .map(function (p) {
          var img = isLocked(p) ? "" : firstImg(p.html);
          return (
            '<article class="card mag-item" data-reveal>' +
            postLink(
              board,
              p,
              (img
                ? '<div class="mag-thumb"><img src="' + esc(img) + '" alt=""></div>'
                : "") +
                '<div class="mag-text"><h3>' +
                (p.pinned ? "📌 " : "") +
                secretTitle(p) +
                "</h3>" +
                meta(p) +
                (isLocked(p)
                  ? ""
                  : '<p class="excerpt">' + esc(strip(p.html, 160)) + "</p>") +
                "</div>"
            ) +
            "</article>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  /* 보기: 갤러리 그리드(썸네일) */
  function renderGrid(board, posts) {
    return (
      '<div class="list-grid">' +
      posts
        .map(function (p) {
          var img = isLocked(p) ? "" : firstImg(p.html);
          var inner =
            (img
              ? '<img src="' + esc(img) + '" alt="">'
              : '<span class="ph">' + esc((p.title || "·").slice(0, 1)) + "</span>") +
            '<span class="cap">' + (p.pinned ? "📌 " : "") + secretTitle(p) + "</span>";
          return (
            '<article class="grid-item" data-reveal>' +
            postLink(board, p, inner) +
            "</article>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  /* 타입: FAQ(접이식 질문/답변) */
  function renderFaq(board, posts) {
    if (!posts.length) return emptyBox(board);
    return (
      '<div class="faq-list">' +
      posts
        .map(function (p) {
          var ans = isLocked(p) ? "<p>🔒 비밀글</p>" : p.html || "";
          return (
            '<div class="faq-item card" data-reveal>' +
            '<button type="button" class="faq-q">' +
            '<span>' + (p.pinned ? "📌 " : "Q. ") + secretTitle(p) + "</span>" +
            '<span class="faq-mark">+</span></button>' +
            '<div class="faq-a">' + ans +
            '<div class="meta muted" style="margin-top:8px">' +
            esc(p.author || "익명") + " · " + fmt(p.createdAt) +
            "</div></div></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function bindFaq() {
    mount.querySelectorAll(".faq-q").forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.parentElement.classList.toggle("is-open");
      });
    });
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
            ? '<a class="card banner" data-reveal target="_blank" rel="noopener" href="' +
                esc(p.link) +
                '">' +
                inner +
                "</a>"
            : '<div class="card banner" data-reveal>' + inner + "</div>";
        })
        .join("") +
      "</div>"
    );
  }

  function renderGuest(board, posts) {
    var form = !SQAuth.hasPerm("writeGuest")
      ? ""
      : '<form class="guest-form card" id="guest-form">' +
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
              '<article class="card guest-entry" data-reveal>' +
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
    if (!canDelete(p)) return "";
    return (
      '<div class="row" style="margin-top:10px">' +
      '<button class="btn btn--sm btn--danger" data-del="' +
      esc(p.id) +
      '">삭제</button></div>'
    );
  }

  function emptyBox(board) {
    return '<div class="empty">아직 글이 없습니다.</div>';
  }

  // 글보기 하단 수정/삭제 버튼(권한에 따라)
  function viewActions(board, p) {
    var btns = "";
    if (canEdit(p))
      btns +=
        '<a class="btn btn--sm" href="' +
        root +
        "write.html?board=" +
        encodeURIComponent(board.id) +
        "&id=" +
        encodeURIComponent(p.id) +
        '">수정</a>';
    if (canDelete(p))
      btns +=
        '<button class="btn btn--sm btn--danger" data-del="' +
        esc(p.id) +
        '">삭제</button>';
    return btns ? '<div class="article-actions">' + btns + "</div>" : "";
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
      var me = window.SQAuth && SQAuth.current();
      SQStore.savePost({
        board: board.id,
        title: "",
        html: "<p>" + esc(msg).replace(/\n/g, "<br>") + "</p>",
        author:
          document.getElementById("g-name").value.trim() ||
          (me && me.displayName) ||
          "익명",
        authorId: me ? me.id : "",
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
      '<article class="article" data-reveal>' +
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
      viewActions(board, p) +
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
    reveal();
  }

  // 스크롤 등장(anim.js). 라이브러리 없으면 즉시 표시.
  function reveal() {
    if (window.SQAnim) SQAnim.reveal(mount);
    else
      mount.querySelectorAll("[data-reveal]").forEach(function (el) {
        el.classList.add("is-revealed");
      });
  }

  /* ---------------- 부트 ---------------- */
  SQStore.getBoard(boardId).then(function (board) {
    if (!board) {
      mount.innerHTML = '<div class="empty">없는 게시판입니다.</div>';
      return;
    }
    document.title = board.name + " — STARQUAKE ARCADE";

    // 회원 전용 게시판은 비로그인 방문자에게 잠금
    if (board.membersOnly && !SQAuth.hasPerm("viewMembersOnly")) {
      mount.innerHTML =
        '<div class="board-head"><div><p class="label">' +
        esc((board.id || "").toUpperCase()) +
        '</p><h1>' +
        esc(board.name) +
        '</h1></div></div>' +
        '<div class="empty">🔒 회원 전용 게시판입니다.<br><br>' +
        '<a class="btn" href="' +
        root +
        "account.html?next=" +
        encodeURIComponent(location.pathname + location.search) +
        '">로그인 하기</a></div>';
      return;
    }

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
