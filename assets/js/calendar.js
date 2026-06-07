(function () {
  "use strict";

  var root = document.documentElement.getAttribute("data-root") || "../";
  var $ = function (id) { return document.getElementById(id); };
  var qs = new URLSearchParams(location.search);
  var view = qs.get("view") === "monthly" ? "monthly" : "daily";

  var store = { categories: [], events: [] };
  var cursor = new Date();
  var TODAY = new Date();
  var DOW = ["SUN.", "MON.", "TUE.", "WED.", "THU.", "FRI.", "SAT."];
  var DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];
  var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parse(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, d.getDate()); }
  function startOfWeek(d) { return addDays(d, -d.getDay()); }
  function t(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
  function diffDays(a, b) { return Math.round((t(b) - t(a)) / 86400000); }
  function sameDay(a, b) { return t(a) === t(b); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function loadStore() {
    if (window.SQDb && SQDb.ready()) {
      return SQDb.fetch("calendar").then(function (val) {
        if (val && val.events) return val;
        return fetchJson();
      });
    }
    return fetchJson();
  }

  function fetchJson() {
    return fetch(root + "data/calendar.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; });
  }

  function persist() {
    if (window.SQDb && SQDb.ready()) return SQDb.push("calendar", store);
    return Promise.resolve(true);
  }

  function findEvent(id) {
    for (var i = 0; i < store.events.length; i++) if (store.events[i].id === id) return store.events[i];
    return null;
  }

  function occurrences(ev, rs, re) {
    var s = parse(ev.start);
    var e = parse(ev.end || ev.start);
    var dur = Math.max(0, diffDays(s, e));
    var rep = ev.repeat || "none";
    var out = [];
    function pushIf(os) {
      var oe = addDays(os, dur);
      if (t(oe) >= t(rs) && t(os) <= t(re)) out.push({ start: os, end: oe });
    }
    if (rep === "none") { pushIf(s); return out; }
    var cur = new Date(s);
    var g = 0;
    if (rep === "weekly") {
      if (t(cur) < t(rs)) cur = addDays(cur, Math.floor(diffDays(cur, rs) / 7) * 7);
      while (t(cur) <= t(re) && g++ < 500) { pushIf(cur); cur = addDays(cur, 7); }
    } else if (rep === "monthly") {
      var mb = (rs.getFullYear() - cur.getFullYear()) * 12 + (rs.getMonth() - cur.getMonth());
      if (mb > 0) cur = addMonths(cur, mb - 1);
      while (t(cur) <= t(re) && g++ < 80) { pushIf(cur); cur = addMonths(cur, 1); }
    } else if (rep === "yearly") {
      var yb = rs.getFullYear() - cur.getFullYear();
      if (yb > 0) cur = new Date(cur.getFullYear() + yb - 1, cur.getMonth(), cur.getDate());
      while (t(cur) <= t(re) && g++ < 40) { pushIf(cur); cur = new Date(cur.getFullYear() + 1, cur.getMonth(), cur.getDate()); }
    }
    return out;
  }

  function occsInRange(rs, re) {
    var list = [];
    store.events.forEach(function (ev) {
      occurrences(ev, rs, re).forEach(function (o) {
        list.push({ ev: ev, start: o.start, end: o.end });
      });
    });
    return list;
  }

  function isDone(ev, occStart) {
    return (ev.doneDates || []).indexOf(ymd(occStart)) >= 0;
  }

  function setView(v) {
    view = v;
    var u = new URL(location.href);
    u.searchParams.set("view", v);
    history.replaceState(null, "", u.pathname + u.search);
    document.querySelectorAll("[data-cal-view]").forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-cal-view") === v);
    });
    render();
  }

  function renderDaily() {
    var y = cursor.getFullYear();
    var m = cursor.getMonth();
    var ms = new Date(y, m, 1);
    var me = new Date(y, m + 1, 0);
    var html = '<h2 class="cal-month-label">' + MONTHS[m] + "</h2>";
    for (var d = new Date(ms); t(d) <= t(me); d = addDays(d, 1)) {
      var occ = occsInRange(d, d);
      var today = sameDay(d, TODAY);
      html +=
        '<section class="cal-day-block" data-date="' + ymd(d) + '">' +
        '<div class="cal-day-head">' +
        '<span class="cal-day-head__date">' + pad(d.getDate()) + "/" + DOW[d.getDay()] + "</span>" +
        (today ? '<span class="cal-day-head__today">TODAY</span>' : "<span></span>") +
        "</div>";
      if (!occ.length) {
        html += '<div class="cal-task" data-add="' + ymd(d) + '"><span class="cal-task__time">00:00</span><span class="cal-task__title">+ 일정</span><span></span><span></span></div>';
      } else {
        occ.forEach(function (o) {
          var done = isDone(o.ev, o.start);
          html +=
            '<div class="cal-task' + (done ? " is-done" : "") + '" data-id="' + o.ev.id + '" data-occ="' + ymd(o.start) + '">' +
            '<span class="cal-task__time">' + esc(o.ev.time || "00:00") + "</span>" +
            '<span class="cal-task__title">' + esc(o.ev.title) + "</span>" +
            '<span class="cal-task__memo">' + esc(o.ev.memo || "") + "</span>" +
            '<button type="button" class="cal-task__check' + (done ? " is-checked" : "") + '" aria-label="완료"></button>' +
            "</div>";
        });
      }
      html += "</section>";
    }
    $("cal-body").innerHTML = html;
  }

  function renderMonthly() {
    var y = cursor.getFullYear();
    var m = cursor.getMonth();
    var ms = new Date(y, m, 1);
    var me = new Date(y, m + 1, 0);
    var gridStart = startOfWeek(ms);
    var occs = occsInRange(gridStart, addDays(startOfWeek(me), 6));
    var html =
      '<div class="cal-month-head"><span>' + MONTHS[m] + "</span><span>" + y + "</span></div>" +
      '<div class="cal-weekdays">' +
      DOW_KO.map(function (d, i) {
        return '<span class="' + (i === 0 ? "sun" : i === 6 ? "sat" : "") + '">' + d + "</span>";
      }).join("") +
      "</div>" +
      '<div class="cal-month-wrap"><div class="cal-grid" id="cal-grid">';
    var cells = "";
    for (var i = 0; i < 42; i++) {
      var d = addDays(gridStart, i);
      var other = d.getMonth() !== m;
      var dot = false;
      occs.forEach(function (o) {
        if (sameDay(o.start, o.end) && sameDay(d, o.start)) dot = true;
      });
      cells +=
        '<div class="cal-cell' + (other ? " is-other" : "") + '" data-date="' + ymd(d) + '">' +
        '<span class="cal-cell__num">' + d.getDate() + "</span>" +
        (dot ? '<span class="cal-cell__dot"></span>' : "") +
        "</div>";
    }
    html += cells + "</div>";
    var bars = "";
    var colW = 100 / 7;
    occs.forEach(function (o) {
      if (sameDay(o.start, o.end)) return;
      var startCol = Math.max(0, diffDays(gridStart, o.start));
      var endCol = Math.min(41, diffDays(gridStart, o.end));
      if (endCol < 0 || startCol > 41) return;
      var row = Math.floor(startCol / 7);
      var sc = startCol % 7;
      var ec = endCol % 7;
      var span = endCol - startCol + 1;
      var left = sc * colW;
      var width = span * colW;
      bars +=
        '<div class="cal-bar" style="top:' + (row * 52 + 28) + "px;left:" + left + "%;width:" + width + '%"></div>';
    });
    html += '<div class="cal-bars">' + bars + "</div></div>";
    html += '<p class="cal-foot">MOVE TO ' + y + " FAV ↓</p>";
    $("cal-body").innerHTML = html;
  }

  function render() {
    if (view === "monthly") renderMonthly();
    else renderDaily();
  }

  var editingId = null;
  function fillCatSelect(sel) {
    $("cm-cat").innerHTML = store.categories
      .map(function (c) {
        return '<option value="' + c.id + '"' + (c.id === sel ? " selected" : "") + ">" + esc(c.name) + "</option>";
      })
      .join("");
  }

  function openModalNew(start, end) {
    editingId = null;
    $("cm-heading").textContent = "새 일정";
    $("cm-title").value = "";
    $("cm-memo").value = "";
    $("cm-time").value = "00:00";
    fillCatSelect(store.categories[0] && store.categories[0].id);
    $("cm-start").value = start;
    $("cm-end").value = end || start;
    $("cm-repeat").value = "none";
    $("cm-delete").style.display = "none";
    $("cal-modal").hidden = false;
  }

  function openModalEdit(id) {
    var ev = findEvent(id);
    if (!ev) return;
    editingId = id;
    $("cm-heading").textContent = "일정 수정";
    $("cm-title").value = ev.title || "";
    $("cm-memo").value = ev.memo || "";
    $("cm-time").value = ev.time || "00:00";
    fillCatSelect(ev.catId);
    $("cm-start").value = ev.start;
    $("cm-end").value = ev.end || ev.start;
    $("cm-repeat").value = ev.repeat || "none";
    $("cm-delete").style.display = "";
    $("cal-modal").hidden = false;
  }

  function closeModal() { $("cal-modal").hidden = true; }

  function saveModal() {
    var title = $("cm-title").value.trim();
    if (!title) { alert("제목을 입력하세요."); return; }
    var start = $("cm-start").value;
    var end = $("cm-end").value || start;
    if (t(parse(end)) < t(parse(start))) { var tmp = start; start = end; end = tmp; }
    var data = {
      title: title,
      memo: $("cm-memo").value.trim(),
      time: $("cm-time").value.trim() || "00:00",
      catId: $("cm-cat").value,
      start: start,
      end: end,
      repeat: $("cm-repeat").value
    };
    if (editingId) Object.assign(findEvent(editingId), data);
    else { data.id = uid(); data.doneDates = []; store.events.push(data); }
    persist().then(function () { closeModal(); render(); });
  }

  function deleteModal() {
    if (!editingId || !confirm("이 일정을 삭제할까요?")) return;
    store.events = store.events.filter(function (e) { return e.id !== editingId; });
    persist().then(function () { closeModal(); render(); });
  }

  function toggleDone(id, occ, e) {
    if (e) e.stopPropagation();
    var ev = findEvent(id);
    if (!ev) return;
    if (!Array.isArray(ev.doneDates)) ev.doneDates = [];
    var i = ev.doneDates.indexOf(occ);
    if (i >= 0) ev.doneDates.splice(i, 1);
    else ev.doneDates.push(occ);
    persist().then(render);
  }

  function bind() {
    document.querySelectorAll("[data-cal-view]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        setView(a.getAttribute("data-cal-view"));
      });
      a.classList.toggle("is-active", a.getAttribute("data-cal-view") === view);
    });

    $("cal-body").addEventListener("click", function (e) {
      var chk = e.target.closest(".cal-task__check");
      if (chk) {
        var row = chk.closest(".cal-task");
        toggleDone(row.dataset.id, row.dataset.occ, e);
        return;
      }
      var add = e.target.closest("[data-add]");
      if (add) { openModalNew(add.getAttribute("data-add")); return; }
      var task = e.target.closest(".cal-task[data-id]");
      if (task) { openModalEdit(task.dataset.id); return; }
      var cell = e.target.closest(".cal-cell");
      if (cell) openModalNew(cell.dataset.date, cell.dataset.date);
      var block = e.target.closest(".cal-day-block");
      if (block && !e.target.closest(".cal-task")) openModalNew(block.dataset.date);
    });

    $("cm-save").addEventListener("click", saveModal);
    $("cm-delete").addEventListener("click", deleteModal);
    $("cm-close").addEventListener("click", closeModal);
    $("cal-modal").addEventListener("click", function (e) { if (e.target === $("cal-modal")) closeModal(); });

    $("cal-export").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "calendar.json";
      a.click();
      URL.revokeObjectURL(a.href);
    });
    $("cal-import").addEventListener("change", function () {
      var f = this.files && this.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          store = JSON.parse(fr.result);
          persist().then(function () { render(); alert("불러왔습니다."); });
        } catch (e) { alert("JSON을 읽을 수 없습니다."); }
      };
      fr.readAsText(f);
    });
  }

  loadStore().then(function (data) {
    store.categories = (data && data.categories) || [{ id: "day", name: "일상", color: "#c6c6c6" }];
    store.events = (data && data.events) || [];
    store.events.forEach(function (ev) {
      if (!Array.isArray(ev.doneDates)) ev.doneDates = ev.done ? [ev.start] : [];
      delete ev.done;
    });
    bind();
    render();
  });
})();
