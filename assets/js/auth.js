/* =====================================================================
 * auth.js — 회원가입 / 로그인 / 등급 · 권한 (SQAuth)
 * ---------------------------------------------------------------------
 * 등급(3단계):
 *   superadmin 최고 관리자 : 모든 권한 (회원·사이트·게시판 관리 포함)
 *   subadmin   부관리자     : 글/게시판 관리 (회원·사이트 설정 제외)
 *   member     회원         : 본인 글 작성/수정/삭제
 *
 * 권한(세분화): manageUsers, manageSite, manageBoards,
 *               writeAny, editAny, deleteAny, pin, secret,
 *               writeMember, editOwn, deleteOwn
 *
 * ⚠️ 보안 메모: 비밀번호는 브라우저에서 해시(SHA-256)해 저장하지만,
 *    DB를 읽을 수 있으면 해시도 보입니다. 즉 "앱 수준 잠금"입니다.
 *    실제 서비스 보안은 Firebase Authentication + 규칙으로 하세요
 *    (docs/FIREBASE.md 참고). 데이터 모델은 그쪽으로 옮기기 쉽게 짰습니다.
 * ===================================================================== */
(function (global) {
  "use strict";

  var SESSION_KEY = "sq:auth";

  // 계정으로 부여 가능한 등급(가입/등급변경 대상)
  var ROLES = ["superadmin", "subadmin", "member"];
  // visitor 는 "비로그인 상태"를 뜻하는 가상 등급(계정으로 부여하지 않음)
  var ROLE_LABEL = {
    superadmin: "최고 관리자",
    subadmin: "부관리자",
    member: "회원",
    visitor: "방문자"
  };

  // 모든 로그인 사용자가 공통으로 가지는 권한
  var COMMON = ["viewPublic", "writeGuest"];

  var PERMS = {
    superadmin: [
      "manageUsers",
      "manageSite",
      "manageBoards",
      "writeAny",
      "editAny",
      "deleteAny",
      "pin",
      "secret",
      "writeMember",
      "editOwn",
      "deleteOwn",
      "viewMembersOnly"
    ].concat(COMMON),
    subadmin: [
      "manageBoards",
      "writeAny",
      "editAny",
      "deleteAny",
      "pin",
      "secret",
      "writeMember",
      "editOwn",
      "deleteOwn",
      "viewMembersOnly"
    ].concat(COMMON),
    member: ["writeMember", "editOwn", "deleteOwn", "secret", "viewMembersOnly"].concat(
      COMMON
    ),
    // 방문자(비로그인): 공개 글 열람 + 방명록 작성만
    visitor: COMMON.slice()
  };

  /* ---------- 비밀번호 해시 ---------- */
  function hash(text) {
    // 보안 컨텍스트(https/localhost)에서는 SHA-256 사용
    if (global.crypto && global.crypto.subtle) {
      var data = new TextEncoder().encode("sq$" + text);
      return crypto.subtle.digest("SHA-256", data).then(function (buf) {
        return Array.prototype.map
          .call(new Uint8Array(buf), function (b) {
            return ("0" + b.toString(16)).slice(-2);
          })
          .join("");
      });
    }
    // 폴백(file:// 등 비보안 컨텍스트): 단순 해시 — 보안 아님
    var h = 5381;
    for (var i = 0; i < text.length; i++) h = (h * 33) ^ text.charCodeAt(i);
    return Promise.resolve("x" + (h >>> 0).toString(16));
  }

  /* ---------- 세션 ---------- */
  function readSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function writeSession(user) {
    try {
      if (user)
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            role: user.role
          })
        );
      else localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  var _current = readSession();

  function current() {
    return _current;
  }
  function role() {
    return _current ? _current.role : null;
  }
  // 권한 판정용 등급 — 비로그인이면 'visitor'
  function effectiveRole() {
    return _current ? _current.role : "visitor";
  }
  function isLoggedIn() {
    return !!_current;
  }
  function isVisitor() {
    return !_current;
  }
  function hasPerm(perm) {
    var list = PERMS[effectiveRole()] || [];
    return list.indexOf(perm) !== -1;
  }
  function isAdmin() {
    return hasPerm("manageBoards"); // subadmin 이상
  }

  /* ---------- 가입 / 로그인 ---------- */
  function normUser(name) {
    return String(name || "").trim().toLowerCase();
  }

  function register(username, password, displayName) {
    username = normUser(username);
    if (!username || !password)
      return Promise.reject(new Error("아이디와 비밀번호를 입력하세요."));
    if (password.length < 4)
      return Promise.reject(new Error("비밀번호는 4자 이상이어야 합니다."));

    return SQStore.getUsers().then(function (users) {
      var exists = Object.keys(users).some(function (k) {
        return users[k].username === username;
      });
      if (exists) throw new Error("이미 사용 중인 아이디입니다.");

      // 첫 가입자는 최고 관리자, 이후는 회원
      var first = Object.keys(users).length === 0;
      return hash(password).then(function (passHash) {
        var id = SQStore.uid();
        var user = {
          id: id,
          username: username,
          displayName: (displayName || username).trim(),
          passHash: passHash,
          role: first ? "superadmin" : "member",
          createdAt: Date.now()
        };
        users[id] = user;
        return SQStore.saveUsers(users).then(function () {
          SQStore.flush("users");
          _current = stripped(user);
          writeSession(user);
          return _current;
        });
      });
    });
  }

  function login(username, password) {
    username = normUser(username);
    return SQStore.getUsers().then(function (users) {
      var user = null;
      Object.keys(users).forEach(function (k) {
        if (users[k].username === username) user = users[k];
      });
      if (!user) throw new Error("아이디를 찾을 수 없습니다.");
      return hash(password).then(function (h) {
        if (h !== user.passHash) throw new Error("비밀번호가 일치하지 않습니다.");
        _current = stripped(user);
        writeSession(user);
        return _current;
      });
    });
  }

  function logout() {
    _current = null;
    writeSession(null);
  }

  function stripped(u) {
    return {
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      role: u.role
    };
  }

  /* ---------- 회원 관리 (최고 관리자) ---------- */
  function listUsers() {
    return SQStore.getUsers().then(function (users) {
      return Object.keys(users).map(function (k) {
        return stripped(users[k]);
      });
    });
  }

  function setRole(userId, newRole) {
    if (!hasPerm("manageUsers"))
      return Promise.reject(new Error("권한이 없습니다."));
    if (ROLES.indexOf(newRole) === -1)
      return Promise.reject(new Error("알 수 없는 등급입니다."));
    return SQStore.getUsers().then(function (users) {
      if (!users[userId]) throw new Error("회원을 찾을 수 없습니다.");
      // 마지막 최고 관리자를 강등하지 못하게 막는다
      var supers = Object.keys(users).filter(function (k) {
        return users[k].role === "superadmin";
      });
      if (
        users[userId].role === "superadmin" &&
        newRole !== "superadmin" &&
        supers.length <= 1
      )
        throw new Error("최고 관리자는 최소 1명 있어야 합니다.");
      users[userId].role = newRole;
      return SQStore.saveUsers(users).then(function () {
        SQStore.flush("users");
        if (_current && _current.id === userId) {
          _current.role = newRole;
          writeSession(users[userId]);
        }
        return true;
      });
    });
  }

  function removeUser(userId) {
    if (!hasPerm("manageUsers"))
      return Promise.reject(new Error("권한이 없습니다."));
    return SQStore.getUsers().then(function (users) {
      if (!users[userId]) return false;
      if (users[userId].role === "superadmin") {
        var supers = Object.keys(users).filter(function (k) {
          return users[k].role === "superadmin";
        });
        if (supers.length <= 1)
          throw new Error("마지막 최고 관리자는 삭제할 수 없습니다.");
      }
      delete users[userId];
      return SQStore.saveUsers(users).then(function () {
        SQStore.flush("users");
        return true;
      });
    });
  }

  global.SQAuth = {
    ROLES: ROLES,
    ROLE_LABEL: ROLE_LABEL,
    PERMS: PERMS,
    current: current,
    role: role,
    effectiveRole: effectiveRole,
    isLoggedIn: isLoggedIn,
    isVisitor: isVisitor,
    isAdmin: isAdmin,
    hasPerm: hasPerm,
    register: register,
    login: login,
    logout: logout,
    listUsers: listUsers,
    setRole: setRole,
    removeUser: removeUser
  };
})(window);
