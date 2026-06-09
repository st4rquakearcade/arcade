/* =====================================================================
 * fonts.js — Google Fonts 로더 / 웹폰트 관리 (SQFont)
 * ---------------------------------------------------------------------
 *  · loadGoogle(families)  : Google Fonts <link> 주입(중복 방지)
 *  · setRole(role, family) : 'display'(제목) / 'body'(본문) 폰트 교체 + 즉시 적용
 *  스타일 프리셋이 기본 폰트를 정하고, 폰트 관리창에서 따로 덮어쓸 수 있습니다.
 * ===================================================================== */
(function (global) {
  "use strict";

  var loaded = {}; // 이미 불러온 family 기록

  // 추천 폰트 목록(관리창 드롭다운). 한글은 시스템/Pretendard 사용 권장.
  var SUGGESTED = [
    "Inter",
    "Pretendard",
    "Playfair Display",
    "Instrument Serif",
    "Quicksand",
    "Nunito Sans",
    "Space Grotesk",
    "DM Sans",
    "Space Mono",
    "Archivo",
    "Poppins",
    "Lora",
    "Noto Sans KR",
    "Gowun Dodum",
    "Nanum Myeongjo"
  ];

  function familyToParam(f) {
    // "Playfair Display" → "Playfair+Display:wght@400;600;700"
    if (f.indexOf(":") !== -1) return f.replace(/ /g, "+");
    return f.replace(/ /g, "+") + ":wght@400;500;600;700";
  }

  function loadGoogle(families) {
    if (!families || !families.length) return;
    var fresh = families.filter(function (f) {
      var key = f.split(":")[0];
      if (loaded[key]) return false;
      loaded[key] = true;
      return true;
    });
    if (!fresh.length) return;
    var href =
      "https://fonts.googleapis.com/css2?" +
      fresh
        .map(function (f) {
          return "family=" + familyToParam(f);
        })
        .join("&") +
      "&display=swap";
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  // 순수 패밀리 이름만 추출("Playfair Display:wght@..." → "Playfair Display")
  function cleanName(f) {
    return f.split(":")[0].replace(/\+/g, " ");
  }

  function setRole(role, family) {
    if (!family) return;
    loadGoogle([family]);
    var name = cleanName(family);
    var stack =
      "'" +
      name +
      "', " +
      (role === "display"
        ? "Georgia, serif"
        : "system-ui, -apple-system, sans-serif");
    document.documentElement.style.setProperty(
      role === "display" ? "--font-display" : "--font-body",
      stack
    );
  }

  global.SQFont = {
    SUGGESTED: SUGGESTED,
    loadGoogle: loadGoogle,
    setRole: setRole,
    cleanName: cleanName
  };
})(window);
