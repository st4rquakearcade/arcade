/* =====================================================================
 * theme.js — 테마(스킨 색) 시스템
 * ---------------------------------------------------------------------
 * 테마는 CSS 변수(--bg, --text 등)의 묶음입니다.
 *   · 빌트인 테마 : /data/themes.json
 *   · 커스텀 테마 : SQStore 의 themes_custom 노드(스킨 에디터에서 저장)
 * applyVars() 가 <html> 의 style 에 변수를 꽂으면 사이트 전체 색이 바뀝니다.
 * ===================================================================== */
(function (global) {
  "use strict";

  var root = document.documentElement.getAttribute("data-root") || "";
  var builtinCache = null;

  function fetchBuiltins() {
    if (builtinCache) return Promise.resolve(builtinCache);
    return fetch(root + "data/themes.json", { cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.json() : {};
      })
      .then(function (j) {
        builtinCache = j || {};
        return builtinCache;
      })
      .catch(function () {
        builtinCache = {};
        return builtinCache;
      });
  }

  /* 빌트인 + 커스텀을 합친 전체 테마 목록 */
  function all() {
    var custom = global.SQStore
      ? SQStore.getCustomThemes()
      : Promise.resolve({});
    return Promise.all([fetchBuiltins(), custom]).then(function (res) {
      var merged = {};
      var b = res[0],
        c = res[1];
      Object.keys(b).forEach(function (k) {
        merged[k] = b[k];
        merged[k].builtin = true;
      });
      Object.keys(c).forEach(function (k) {
        merged[k] = c[k];
        merged[k].builtin = false;
      });
      return merged;
    });
  }

  /* CSS 변수 묶음을 <html> 에 적용 */
  function applyVars(vars, mode) {
    var el = document.documentElement;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        el.style.setProperty(k, vars[k]);
      });
    }
    el.setAttribute("data-mode", mode || "dark");
  }

  /* 테마 id 로 적용. 없으면 첫 빌트인으로. */
  function apply(id) {
    return all().then(function (themes) {
      var t = themes[id] || themes[Object.keys(themes)[0]];
      if (t) {
        // 프리셋이 쓰는 Google Fonts 먼저 로드
        if (t.googleFonts && global.SQFont) SQFont.loadGoogle(t.googleFonts);
        applyVars(t.vars, t.mode);
        document.documentElement.setAttribute("data-theme", id);
      }
      return t;
    });
  }

  /* 페이지 로드시 사이트 설정의 theme 을 읽어 적용.
   * 방문자가 개인적으로 고른 테마(sq:theme:pref)가 있으면 우선. */
  function init() {
    var pref = null;
    try {
      pref = localStorage.getItem("sq:theme:pref");
    } catch (e) {}
    if (!global.SQStore) {
      if (pref) apply(pref);
      return Promise.resolve();
    }
    return SQStore.getSite().then(function (site) {
      return apply(pref || (site && site.theme) || "editorial").then(function () {
        // 사이트에 따로 지정한 폰트가 있으면 프리셋 폰트를 덮어쓴다
        var f = site && site.fonts;
        if (f && global.SQFont) {
          if (f.display) SQFont.setRole("display", f.display);
          if (f.body) SQFont.setRole("body", f.body);
        }
      });
    });
  }

  /* 방문자 개인 선택 저장 + 적용 */
  function setPreference(id) {
    try {
      localStorage.setItem("sq:theme:pref", id);
    } catch (e) {}
    return apply(id);
  }

  global.SQTheme = {
    all: all,
    apply: apply,
    applyVars: applyVars,
    init: init,
    setPreference: setPreference
  };
})(window);
