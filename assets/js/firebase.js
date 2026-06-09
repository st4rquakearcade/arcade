/* =====================================================================
 * firebase.js — Firebase 연동 "전용" 파일
 * ---------------------------------------------------------------------
 * Firebase 관련 코드는 전부 이 파일에 모여 있습니다.
 * 나머지 앱 코드(store/app/board/write/skin)는 Firebase를 직접 모르고,
 * 오직 여기서 만든 window.SQDb 만 사용합니다. 그래서:
 *   · 이 파일만 지우거나 비워도 사이트는 localStorage 로 그대로 동작합니다.
 *   · 배포할 때는 firebase-config.js 의 키만 채우면 자동으로 연결됩니다.
 *
 * 필요 조건: HTML 에서 이 파일보다 먼저
 *   - firebase-app-compat.js / firebase-database-compat.js (CDN)
 *   - firebase-config.js (window.SQ_FIREBASE 키)
 * 가 로드돼 있어야 합니다.
 * ===================================================================== */
(function (global) {
  "use strict";

  var db = null;
  var ok = false;

  // 설정이 실제로 채워져 있는지(플레이스홀더가 아닌지) 확인
  function hasConfig(c) {
    return (
      c &&
      c.apiKey &&
      c.databaseURL &&
      String(c.apiKey).indexOf("여기에") === -1
    );
  }

  function init() {
    var cfg = global.SQ_FIREBASE;
    if (!hasConfig(cfg)) return; // 키 없으면 조용히 비활성화 → localStorage 사용
    if (typeof firebase === "undefined" || !firebase.initializeApp) return;
    try {
      if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(cfg);
      db = firebase.database();
      ok = true;
    } catch (e) {
      ok = false;
    }
  }
  init();

  global.SQDb = {
    ready: function () {
      return ok && !!db;
    },
    fetch: function (node) {
      if (!this.ready()) return Promise.resolve(null);
      return db
        .ref(node)
        .once("value")
        .then(function (snap) {
          return snap.val();
        })
        .catch(function () {
          return null;
        });
    },
    watch: function (node, cb) {
      if (!this.ready()) return function () {};
      var ref = db.ref(node);
      var handler = ref.on("value", function (snap) {
        cb(snap.val());
      });
      return function () {
        ref.off("value", handler);
      };
    },
    push: function (node, val) {
      if (!this.ready()) return Promise.resolve(false);
      return db
        .ref(node)
        .set(val == null ? null : val)
        .then(function () {
          return true;
        })
        .catch(function () {
          return false;
        });
    }
  };
})(window);
