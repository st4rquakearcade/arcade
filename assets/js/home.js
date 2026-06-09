/* =====================================================================
 * home.js — 대문 카드 스택 렌더 + GSAP 등장 애니메이션
 * ---------------------------------------------------------------------
 *  · 첫 패널: 사이트 인트로(site.json)
 *  · 이후 패널: 게시판별 요약 카드(최근 글 3개)
 *  GSAP / ScrollTrigger 가 있으면 스크롤에 맞춰 카드가 등장합니다.
 * ===================================================================== */
(function () {
  "use strict";

  var esc = SQApp.esc;
  var root = SQApp.root;
  var mount = document.getElementById("stack");
  if (!mount) return;

  function fmtDate(ts) {
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

  function introPanel(site) {
    var title = site.title || ["STARQUAKE", "ARCADE"];
    var t = Array.isArray(title) ? title : [title];
    var hero = site.image
      ? '<img src="' + esc(site.image) + '" alt="" />'
      : "IMAGE";
    return (
      '<section class="panel" data-anim="intro">' +
      '<div class="intro">' +
      '<p class="handle">' +
      esc(site.handle || "") +
      "</p>" +
      "<h1>" +
      t.map(esc).join("<br>") +
      "</h1>" +
      '<div class="hero-img">' +
      hero +
      "</div>" +
      '<p class="desc">' +
      esc(site.description || "") +
      "</p>" +
      '<p class="scroll-hint">SCROLL ↓</p>' +
      "</div>" +
      "</section>"
    );
  }

  function boardPanel(board, posts) {
    // 회원 전용 게시판은 방문자에게 글 목록을 숨긴다
    var locked = board.membersOnly && !SQAuth.hasPerm("viewMembersOnly");
    var rows = locked
      ? '<li><a class="muted">🔒 회원 전용 게시판입니다.</a></li>'
      : posts.length === 0
        ? '<li><a class="muted">아직 글이 없습니다.</a></li>'
        : posts
            .map(function (p) {
              var title =
                p.secret && !SQApp.isOwner()
                  ? "🔒 비밀글"
                  : esc(p.title || stripText(p.html) || "(제목 없음)");
              return (
                "<li><a href=\"" +
                root +
                "board.html?board=" +
                encodeURIComponent(board.id) +
                "&id=" +
                encodeURIComponent(p.id) +
                '"><span class="t">' +
                (p.pinned ? "📌 " : "") +
                title +
                '</span><span class="d">' +
                fmtDate(p.createdAt) +
                "</span></a></li>"
              );
            })
            .join("");

    return (
      '<section class="panel" data-anim="card">' +
      '<div class="stack-card board-card">' +
      '<p class="label"><span>' +
      esc(board.icon || "·") +
      "</span> " +
      esc((board.id || "").toUpperCase()) +
      "</p>" +
      "<h2>" +
      esc(board.name) +
      "</h2>" +
      '<p class="muted">' +
      esc(board.desc || "") +
      "</p>" +
      '<ul class="preview-list">' +
      rows +
      "</ul>" +
      '<a class="go" href="' +
      root +
      "board.html?board=" +
      encodeURIComponent(board.id) +
      '">전체 보기 →</a>' +
      "</div>" +
      "</section>"
    );
  }

  function stripText(html) {
    var d = document.createElement("div");
    d.innerHTML = html || "";
    return (d.textContent || "").trim().slice(0, 40);
  }

  function animate() {
    if (!window.gsap) return;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray(".panel > *").forEach(function (el) {
      gsap.from(el, {
        opacity: 0,
        y: 40,
        scale: 0.98,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: window.ScrollTrigger
          ? { trigger: el, start: "top 80%" }
          : undefined
      });
    });
  }

  SQStore.getSite().then(function (site) {
    return SQStore.getBoards().then(function (boards) {
      var others = boards.filter(function (b) {
        return b.id !== "home";
      });
      // 각 보드의 최근 글 3개를 모은다
      return Promise.all(
        others.map(function (b) {
          return SQStore.getPosts(b.id).then(function (ps) {
            return { board: b, posts: ps.slice(0, 3) };
          });
        })
      ).then(function (data) {
        var html = introPanel(site);
        data.forEach(function (d) {
          html += boardPanel(d.board, d.posts);
        });
        mount.innerHTML = html;
        requestAnimationFrame(animate);
      });
    });
  });
})();
