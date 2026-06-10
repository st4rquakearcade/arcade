/* =====================================================================
 * icons.js — SVG 아이콘 라이브러리 + 드롭다운 선택기 (SQIcons)
 * ---------------------------------------------------------------------
 *  · 40개 이상의 라인 아이콘을 이름으로 보관
 *  · SQIcons.svg(name)         → <svg> 문자열(currentColor, 1em)
 *  · SQIcons.has(name)         → 존재 여부
 *  · SQIcons.render(v)         → 아이콘이면 SVG, 아니면 텍스트(하위호환)
 *  · SQIcons.attachPicker(btn, value, onChange) → 어느 페이지에서나 쓰는 선택 드롭다운
 * ===================================================================== */
(function (global) {
  "use strict";

  var ICONS = {
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>',
    diamond: '<path d="M12 3l8 6-8 12L4 9z"/>',
    star: '<path d="M12 3l2.6 5.6 6 .7-4.4 4 1.2 6L12 18l-5.4 3 1.2-6-4.4-4 6-.7z"/>',
    heart: '<path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.5 12 20 12 20z"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    pin: '<path d="M12 21s6-5.3 6-10A6 6 0 0 0 6 11c0 4.7 6 10 6 10z"/><circle cx="12" cy="11" r="2.2"/>',
    note: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>',
    image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M5 18l5-5 4 4 2-2 3 3"/>',
    link: '<path d="M9 15l6-6"/><path d="M10 7l1-1a4 4 0 0 1 6 6l-1 1"/><path d="M14 17l-1 1a4 4 0 0 1-6-6l1-1"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M16 6a3 3 0 0 1 0 6M21 19a6 6 0 0 0-4-5.7"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7l8 6 8-6"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>',
    tag: '<path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
    bookmark: '<path d="M7 4h10v16l-5-3.5L7 20z"/>',
    folder: '<path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>',
    file: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/>',
    music: '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>',
    camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-2h5L16 7"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
    chat: '<path d="M5 5h14v10H9l-4 4z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    fire: '<path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s.2 2 2 2c1.6 0 1-3 2-5 1 1 0-4 0-4z"/>',
    flag: '<path d="M6 21V4"/><path d="M6 5h11l-2 3 2 3H6"/>',
    globe: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.5 2.5 13 0 16M12 4c-2.5 2.5-2.5 13 0 16"/>',
    moon: '<path d="M20 14a8 8 0 1 1-9-10 6 6 0 0 0 9 10z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    cloud: '<path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.5 1.5A3.5 3.5 0 0 1 17 18z"/>',
    coffee: '<path d="M5 9h12v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2"/><path d="M8 3v2M11 3v2M14 3v2"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M4 13h16M12 9v11"/><path d="M12 9S10 4 8 5s1 4 4 4 6-3 4-4-4 4-4 4z"/>',
    game: '<rect x="3" y="8" width="18" height="9" rx="4"/><path d="M8 11v3M6.5 12.5h3"/><circle cx="16" cy="11.5" r="1"/><circle cx="18" cy="13.5" r="1"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-1 1-2s0-2 1-2h2a4 4 0 0 0 4-4 9 9 0 0 0-8-8z"/><circle cx="8" cy="11" r="1"/><circle cx="12" cy="8" r="1"/><circle cx="16" cy="11" r="1"/>',
    pencil: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
    trash: '<path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13"/>',
    check: '<path d="M5 12l5 5L20 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    flower: '<circle cx="12" cy="12" r="2.4"/><path d="M12 3.5a3 3 0 0 1 0 6M12 14.5a3 3 0 0 1 0 6M3.5 12a3 3 0 0 1 6 0M14.5 12a3 3 0 0 1 6 0"/>',
    leaf: '<path d="M5 19C5 9 12 5 19 5c0 10-7 14-14 14z"/><path d="M5 19c4-6 8-8 12-9"/>',
    paw: '<circle cx="8" cy="9" r="1.5"/><circle cx="16" cy="9" r="1.5"/><circle cx="5.5" cy="13" r="1.3"/><circle cx="18.5" cy="13" r="1.3"/><path d="M12 12c2.8 0 4.6 2.6 3.8 4.6S13 18 12 18s-3-.2-3.8-1.4S9.2 12 12 12z"/>',
    ghost: '<path d="M6 20V11a6 6 0 1 1 12 0v9l-2-1.5L14 20l-2-1.5L10 20l-2-1.5z"/><circle cx="10" cy="11" r=".7"/><circle cx="14" cy="11" r=".7"/>',
    smile: '<circle cx="12" cy="12" r="8"/><path d="M9 14a4 4 0 0 0 6 0"/><circle cx="9.5" cy="10" r=".8"/><circle cx="14.5" cy="10" r=".8"/>',
    hash: '<path d="M6 9h14M5 15h14M10 4l-2 16M16 4l-2 16"/>',
    bolt: '<path d="M13 3L5 13h6l-1 8 8-11h-6z"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h6v16H6a2 2 0 0 0-2 2z"/><path d="M20 5a2 2 0 0 0-2-2h-6v16h6a2 2 0 0 1 2 2z"/>',
    quote: '<path d="M7 7h4v4a4 4 0 0 1-4 4M13 7h4v4a4 4 0 0 1-4 4"/>',
    map: '<path d="M9 4L4 6v14l5-2 6 2 5-2V4l-5 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    headphone: '<path d="M5 14v-2a7 7 0 0 1 14 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
    cup: '<path d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z"/><path d="M9 5s.5-2 3-2 3 2 3 2"/>'
  };

  function svg(name, size) {
    var inner = ICONS[name];
    if (!inner) return "";
    var s = size || "1em";
    return (
      '<svg class="sqi" viewBox="0 0 24 24" width="' +
      s +
      '" height="' +
      s +
      '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      inner +
      "</svg>"
    );
  }

  function escText(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render(v) {
    return ICONS[v] ? svg(v) : escText(v || "·");
  }

  /* ---------- 드롭다운 선택기(공용) ---------- */
  var pop = null;
  function buildPop() {
    if (pop) return pop;
    pop = document.createElement("div");
    pop.className = "icon-pop";
    pop.innerHTML =
      '<input type="text" class="icon-pop-search" placeholder="아이콘 검색…" />' +
      '<div class="icon-pop-grid"></div>';
    document.body.appendChild(pop);
    document.addEventListener("click", function (e) {
      if (pop.classList.contains("open") && !pop.contains(e.target) && !pop._trigger.contains(e.target))
        close();
    });
    return pop;
  }
  function close() {
    if (pop) pop.classList.remove("open");
  }
  function fillGrid(filter, onPick) {
    var grid = pop.querySelector(".icon-pop-grid");
    var names = Object.keys(ICONS).filter(function (n) {
      return !filter || n.indexOf(filter.toLowerCase()) !== -1;
    });
    grid.innerHTML = names
      .map(function (n) {
        return (
          '<button type="button" class="icon-opt" data-n="' +
          n +
          '" title="' +
          n +
          '">' +
          svg(n) +
          "</button>"
        );
      })
      .join("");
    grid.querySelectorAll(".icon-opt").forEach(function (b) {
      b.addEventListener("click", function () {
        onPick(b.dataset.n);
        close();
      });
    });
  }

  // trigger 버튼에 선택기를 붙인다. onChange(name) 콜백으로 결과 전달.
  function attachPicker(trigger, value, onChange) {
    function paint(v) {
      trigger.innerHTML = svg(v || "note") + '<span class="cap">▾</span>';
      trigger.dataset.value = v || "";
    }
    paint(value);
    trigger.classList.add("icon-pick");
    trigger.type = "button";
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      var p = buildPop();
      p._trigger = trigger;
      var search = p.querySelector(".icon-pop-search");
      search.value = "";
      fillGrid("", function (n) {
        paint(n);
        onChange(n);
      });
      search.oninput = function () {
        fillGrid(search.value.trim(), function (n) {
          paint(n);
          onChange(n);
        });
      };
      var r = trigger.getBoundingClientRect();
      p.style.top = window.scrollY + r.bottom + 6 + "px";
      p.style.left = window.scrollX + r.left + "px";
      p.classList.add("open");
      search.focus();
    });
  }

  global.SQIcons = {
    names: function () {
      return Object.keys(ICONS);
    },
    has: function (n) {
      return !!ICONS[n];
    },
    svg: svg,
    render: render,
    attachPicker: attachPicker
  };
})(window);
