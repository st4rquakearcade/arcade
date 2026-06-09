/* =====================================================================
 * store.js — 통합 데이터 저장소
 * ---------------------------------------------------------------------
 * 데이터는 3단계로 읽고 씁니다.
 *   1) Firebase RTDB 가 연결돼 있으면  → RTDB 사용 (배포용·여러 기기 공유)
 *   2) 아니면                          → 브라우저 localStorage 사용 (혼자 테스트용)
 *   3) 둘 다 비어 있으면               → /data/*.json 시드 파일을 읽어 첫 화면 구성
 *
 * 다루는 노드(데이터 묶음): site · boards · posts · themes
 * 초보자는 보통 /data/*.json 만 고쳐도 됩니다.
 * ===================================================================== */
(function (global) {
  "use strict";

  var root = document.documentElement.getAttribute("data-root") || "";
  var LS = "sq:"; // localStorage 키 접두사
  var cache = {}; // 노드별 메모리 캐시

  function usingFirebase() {
    return !!(global.SQDb && global.SQDb.ready());
  }

  /* Firebase 가 응답하지 않을 때 무한 대기를 막는 안전 타임아웃.
   * 제한 시간 안에 안 오면 null 로 처리해 시드 파일로 넘어간다. */
  function withTimeout(promise, ms) {
    return new Promise(function (resolve) {
      var done = false;
      var t = setTimeout(function () {
        if (!done) {
          done = true;
          resolve(null);
        }
      }, ms || 5000);
      promise.then(
        function (v) {
          if (!done) {
            done = true;
            clearTimeout(t);
            resolve(v);
          }
        },
        function () {
          if (!done) {
            done = true;
            clearTimeout(t);
            resolve(null);
          }
        }
      );
    });
  }

  /* /data/<node>.json 시드 읽기 (네트워크) */
  function fetchSeed(node) {
    return fetch(root + "data/" + node + ".json", { cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .catch(function () {
        return null;
      });
  }

  function lsGet(node) {
    try {
      var raw = localStorage.getItem(LS + node);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function lsSet(node, val) {
    try {
      localStorage.setItem(LS + node, JSON.stringify(val));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* 노드 하나를 읽는다. 위 3단계 우선순위를 따른다. */
  function get(node) {
    if (cache[node] != null) return Promise.resolve(clone(cache[node]));

    if (usingFirebase()) {
      // 타임아웃으로 감싸 무한 로딩을 방지한다.
      return withTimeout(global.SQDb.fetch(node), 5000).then(function (val) {
        if (val != null) {
          cache[node] = val;
          return clone(val);
        }
        // RTDB 가 비었거나 응답이 없으면 시드 파일로 첫 화면을 보여준다.
        return fetchSeed(node).then(function (seed) {
          cache[node] = seed;
          return clone(seed);
        });
      });
    }

    var local = lsGet(node);
    if (local != null) {
      cache[node] = local;
      return Promise.resolve(clone(local));
    }
    return fetchSeed(node).then(function (seed) {
      cache[node] = seed;
      if (seed != null) lsSet(node, seed); // 다음부터 빠르게
      return clone(seed);
    });
  }

  /* 노드 하나를 통째로 저장한다. */
  function set(node, val) {
    cache[node] = val;
    if (usingFirebase()) {
      return global.SQDb.push(node, val).then(function (ok) {
        return ok;
      });
    }
    return Promise.resolve(lsSet(node, val));
  }

  function clone(v) {
    return v == null ? v : JSON.parse(JSON.stringify(v));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ---------- site (사이트 기본 설정) ---------- */
  function getSite() {
    return get("site").then(function (s) {
      return s || {};
    });
  }
  function saveSite(s) {
    return set("site", s);
  }

  /* ---------- boards (게시판 목록) ---------- */
  function getBoards() {
    return get("boards").then(function (b) {
      var arr = Array.isArray(b) ? b : [];
      return arr.slice().sort(function (a, c) {
        return (a.order || 0) - (c.order || 0);
      });
    });
  }
  function getBoard(id) {
    return getBoards().then(function (arr) {
      return (
        arr.filter(function (b) {
          return b.id === id;
        })[0] || null
      );
    });
  }
  function saveBoards(arr) {
    return set("boards", arr);
  }

  /* ---------- posts (글) ---------- */
  function postsArr() {
    return get("posts").then(function (p) {
      if (Array.isArray(p)) return p;
      if (p && Array.isArray(p.posts)) return p.posts;
      return [];
    });
  }

  function sortPosts(a, b) {
    if (!!b.pinned !== !!a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
    return (b.createdAt || 0) - (a.createdAt || 0);
  }

  function getPosts(board) {
    return postsArr().then(function (arr) {
      var list = board
        ? arr.filter(function (p) {
            return p.board === board;
          })
        : arr.slice();
      return list.sort(sortPosts);
    });
  }

  function getPost(id) {
    return postsArr().then(function (arr) {
      return (
        arr.filter(function (p) {
          return p.id === id;
        })[0] || null
      );
    });
  }

  function recentPosts(n) {
    return postsArr().then(function (arr) {
      return arr
        .slice()
        .sort(function (a, b) {
          return (b.createdAt || 0) - (a.createdAt || 0);
        })
        .slice(0, n || 5);
    });
  }

  function savePost(post) {
    return postsArr().then(function (arr) {
      var now = Date.now();
      var next = arr.slice();
      var idx = -1;
      if (post.id) {
        for (var i = 0; i < next.length; i++)
          if (next[i].id === post.id) idx = i;
      }
      if (idx >= 0) {
        post.createdAt = next[idx].createdAt || now;
        post.updatedAt = now;
        next[idx] = post;
      } else {
        if (!post.id) post.id = uid();
        post.createdAt = post.updatedAt = now;
        next.push(post);
      }
      return set("posts", next).then(function () {
        return post;
      });
    });
  }

  function removePost(id) {
    return postsArr().then(function (arr) {
      var next = arr.filter(function (p) {
        return p.id !== id;
      });
      return set("posts", next).then(function () {
        return next;
      });
    });
  }

  /* ---------- themes_custom (사용자 커스텀 프리셋) ----------
   * 빌트인 테마는 /data/themes.json(읽기 전용)에 있고,
   * 사용자가 만든 프리셋만 여기 themes_custom 노드에 저장한다. */
  function getCustomThemes() {
    return get("themes_custom").then(function (t) {
      return t && typeof t === "object" ? t : {};
    });
  }
  function saveCustomThemes(obj) {
    return set("themes_custom", obj);
  }

  /* ---------- users (회원) ----------
   * { <userId>: { id, username, displayName, passHash, role, createdAt } } */
  function getUsers() {
    return get("users").then(function (u) {
      return u && typeof u === "object" ? u : {};
    });
  }
  function saveUsers(obj) {
    return set("users", obj);
  }

  /* 캐시 비우기(저장 후 다른 페이지에서 최신 데이터 보려고 할 때) */
  function flush(node) {
    if (node) delete cache[node];
    else cache = {};
  }

  global.SQStore = {
    usingFirebase: usingFirebase,
    uid: uid,
    flush: flush,
    getSite: getSite,
    saveSite: saveSite,
    getBoards: getBoards,
    getBoard: getBoard,
    saveBoards: saveBoards,
    getPosts: getPosts,
    getPost: getPost,
    recentPosts: recentPosts,
    savePost: savePost,
    removePost: removePost,
    getCustomThemes: getCustomThemes,
    saveCustomThemes: saveCustomThemes,
    getUsers: getUsers,
    saveUsers: saveUsers
  };
})(window);
