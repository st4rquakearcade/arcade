/* =====================================================================
 * home.js — 대문: 넓은 카드 월 (masonry / bento / grid 전환)
 * ---------------------------------------------------------------------
 *  · 레이아웃은 site.homeLayout (스킨 에디터에서 변경)
 *  · bento 모드에서는 관리자가 카드를 드래그해 배치 → site.homeOrder 저장
 * ===================================================================== */
(function () {
  "use strict";

  var esc = SQApp.esc;
  var root = SQApp.root;
  var mount = document.getElementById("stack");
  if (!mount) return;

  var ico = function (v) {
    return window.SQIcons ? SQIcons.render(v) : esc(v || "·");
  };

  function strip(html, n) {
    var d = document.createElement("div");
    d.innerHTML = html || "";
    return (d.textContent || "").trim().slice(0, n || 36);
  }

  var siteCache = null,
    rowsCache = null,
    layoutCache = "masonry";

  function hero(site) {
    var title = site.title || ["STARQUAKE", "ARCADE"];
    var name = Array.isArray(title) ? title.join(" ") : title;
    var avatar = site.image
      ? '<img src="' + esc(site.image) + '" alt="" />'
      : esc((name || "·").slice(0, 1));
    return (
      '<div class="home-hero" data-reveal>' +
      '<div class="avatar">' +
      avatar +
      "</div><div>" +
      (site.handle ? '<p class="handle">' + esc(site.handle) + "</p>" : "") +
      "<h1>" +
      esc(name) +
      "</h1>" +
      (site.description ? '<p class="desc">' + esc(site.description) + "</p>" : "") +
      "</div></div>"
    );
  }

  function sizeOf(row) {
    var n = row.posts.length;
    if (n >= 3) return "l";
    if (n === 0) return "s";
    return "m";
  }

  function card(row, draggable) {
    var b = row.board;
    var locked = b.membersOnly && !SQAuth.hasPerm("viewMembersOnly");
    var lis = locked
      ? "<li>🔒 회원 전용</li>"
      : row.posts
          .map(function (p) {
            var t =
              p.secret && !SQApp.isOwner()
                ? "비밀글"
                : esc(p.title || strip(p.html) || "새 글");
            return "<li>" + (p.pinned ? "📌 " : "") + t + "</li>";
          })
          .join("");
    return (
      '<article class="home-card" data-size="' +
      sizeOf(row) +
      '" data-id="' +
      esc(b.id) +
      '"' +
      (draggable ? ' draggable="true"' : "") +
      ' data-reveal>' +
      '<a href="' +
      root +
      "board.html?board=" +
      encodeURIComponent(b.id) +
      '"><div class="hc-head"><span class="hc-ico">' +
      ico(b.icon) +
      "</span><h2>" +
      esc(b.name) +
      "</h2></div>" +
      (lis ? '<ul class="hc-list">' + lis + "</ul>" : "") +
      '<span class="hc-go">열기 ↗</span></a></article>'
    );
  }

  function orderRows(rows, site) {
    var order = site.homeOrder;
    if (!order || !order.length) return rows;
    var byId = {};
    rows.forEach(function (r) {
      byId[r.board.id] = r;
    });
    var out = [];
    order.forEach(function (id) {
      if (byId[id]) {
        out.push(byId[id]);
        delete byId[id];
      }
    });
    rows.forEach(function (r) {
      if (byId[r.board.id]) out.push(r);
    });
    return out;
  }

  function render() {
    var site = siteCache,
      rows = orderRows(rowsCache, site);
    var layout = site.homeLayout || "masonry";
    layoutCache = layout;
    var owner = SQApp.isOwner();
    var canDrag = layout === "bento" && owner;

    var html =
      '<div class="home-wrap">' +
      hero(site) +
      (canDrag
        ? '<p class="bento-hint" data-reveal>카드를 드래그해 배치할 수 있어요.</p>'
        : "") +
      '<div class="home-' +
      esc(layout) +
      '" id="home-cards">' +
      rows
        .map(function (r) {
          return card(r, canDrag);
        })
        .join("") +
      "</div></div>";
    mount.innerHTML = html;

    if (canDrag) bindDrag();
    if (window.SQAnim) SQAnim.reveal(mount);
    else
      mount.querySelectorAll("[data-reveal]").forEach(function (el) {
        el.classList.add("is-revealed");
      });
  }

  /* 벤토 드래그 배치 */
  function bindDrag() {
    var container = document.getElementById("home-cards");
    var dragId = null;
    container.querySelectorAll(".home-card").forEach(function (cardEl) {
      cardEl.addEventListener("dragstart", function (e) {
        dragId = cardEl.dataset.id;
        cardEl.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });
      cardEl.addEventListener("dragend", function () {
        cardEl.classList.remove("dragging");
        container
          .querySelectorAll(".drag-over")
          .forEach(function (x) {
            x.classList.remove("drag-over");
          });
      });
      cardEl.addEventListener("dragover", function (e) {
        e.preventDefault();
        cardEl.classList.add("drag-over");
      });
      cardEl.addEventListener("dragleave", function () {
        cardEl.classList.remove("drag-over");
      });
      cardEl.addEventListener("drop", function (e) {
        e.preventDefault();
        cardEl.classList.remove("drag-over");
        if (!dragId || dragId === cardEl.dataset.id) return;
        reorder(dragId, cardEl.dataset.id);
      });
    });
  }

  function reorder(fromId, toId) {
    var ids = Array.prototype.map.call(
      document.querySelectorAll("#home-cards .home-card"),
      function (el) {
        return el.dataset.id;
      }
    );
    ids.splice(ids.indexOf(fromId), 1);
    ids.splice(ids.indexOf(toId), 0, fromId);
    siteCache.homeOrder = ids;
    SQStore.saveSite(siteCache).then(function () {
      SQStore.flush("site");
    });
    render();
  }

  SQStore.getSite().then(function (site) {
    siteCache = site || {};
    return SQStore.getBoards().then(function (boards) {
      var others = boards.filter(function (b) {
        return b.id !== "home";
      });
      return Promise.all(
        others.map(function (b) {
          return SQStore.getPosts(b.id).then(function (ps) {
            return { board: b, posts: ps.slice(0, 4) };
          });
        })
      ).then(function (rows) {
        rowsCache = rows;
        render();
      });
    });
  });
})();
