/* =====================================================================
 * home.js — 대문 (carrd / linktree 식 중앙 카드 스택)
 * ---------------------------------------------------------------------
 *  · 위: 프로필(아바타·핸들·이름·소개)
 *  · 아래: 게시판으로 가는 링크 카드가 세로로 쌓임(최근 글 제목을 부제로)
 * ===================================================================== */
(function () {
  "use strict";

  var esc = SQApp.esc;
  var root = SQApp.root;
  var mount = document.getElementById("stack");
  if (!mount) return;

  function strip(html, n) {
    var d = document.createElement("div");
    d.innerHTML = html || "";
    return (d.textContent || "").trim().slice(0, n || 40);
  }

  function profile(site) {
    var title = site.title || ["STARQUAKE", "ARCADE"];
    var name = Array.isArray(title) ? title.join(" ") : title;
    var avatar = site.image
      ? '<img src="' + esc(site.image) + '" alt="" />'
      : esc((name || "·").slice(0, 1));
    return (
      '<div class="bio-profile" data-reveal>' +
      '<div class="bio-avatar">' +
      avatar +
      "</div>" +
      (site.handle
        ? '<p class="bio-handle">' + esc(site.handle) + "</p>"
        : "") +
      '<h1 class="bio-name">' +
      esc(name) +
      "</h1>" +
      (site.description
        ? '<p class="bio-desc">' + esc(site.description) + "</p>"
        : "") +
      "</div>"
    );
  }

  function linkCard(board, latest) {
    var locked = board.membersOnly && !SQAuth.hasPerm("viewMembersOnly");
    var sub = locked
      ? "🔒 회원 전용"
      : latest
      ? esc(latest.secret && !SQApp.isOwner()
          ? "비밀글"
          : latest.title || strip(latest.html) || "새 글")
      : "";
    return (
      '<a class="link-card" data-reveal href="' +
      root +
      "board.html?board=" +
      encodeURIComponent(board.id) +
      '">' +
      '<span class="lc-ico">' +
      esc(board.icon || "·") +
      "</span>" +
      '<span class="lc-text">' +
      '<span class="lc-name">' +
      esc(board.name) +
      "</span>" +
      (sub ? '<span class="lc-sub">' + sub + "</span>" : "") +
      "</span>" +
      '<span class="lc-arrow">↗</span>' +
      "</a>"
    );
  }

  function reveal() {
    if (window.SQAnim) SQAnim.reveal(mount);
    else
      mount.querySelectorAll("[data-reveal]").forEach(function (el) {
        el.classList.add("is-revealed");
      });
  }

  SQStore.getSite().then(function (site) {
    return SQStore.getBoards().then(function (boards) {
      var others = boards.filter(function (b) {
        return b.id !== "home";
      });
      return Promise.all(
        others.map(function (b) {
          return SQStore.getPosts(b.id).then(function (ps) {
            return { board: b, latest: ps[0] || null };
          });
        })
      ).then(function (rows) {
        var html =
          '<div class="bio">' +
          profile(site) +
          '<nav class="link-stack">' +
          rows
            .map(function (r) {
              return linkCard(r.board, r.latest);
            })
            .join("") +
          "</nav>" +
          (site.footer
            ? '<footer class="bio-foot" data-reveal>' + esc(site.footer) + "</footer>"
            : "") +
          "</div>";
        mount.innerHTML = html;
        reveal();
      });
    });
  });
})();
