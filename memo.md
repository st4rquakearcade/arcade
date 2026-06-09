# STARQUAKE ARCADE — memo

## 아키텍처 (현재)
정적 HTML/CSS/JS + JSON 데이터 + GSAP. 빌드 없음.
데이터 우선순위: Firebase RTDB → localStorage → /data/*.json 시드.

### 페이지
- `index.html` 대문(카드 스택+스냅, home.js)
- `board.html` 만능 게시판 (?board=, ?id=) — list/stream/guest/banner 타입별 렌더
- `write.html` 리치 텍스트 글쓰기 에디터
- `editor.html` 스킨 에디터(사이트/테마/게시판/백업)
- `seed.html` Firebase 첫 업로드 도구

### JS (assets/js)
- `store.js` 통합 데이터 계층(SQStore)
- `theme.js` 테마 적용/프리셋(SQTheme)
- `app.js` 공통 부트(내비·주인모드·로더)
- `home.js` `board.js` `write.js` `skin.js` 페이지별
- `db.js` Firebase 래퍼(SQDb), `imgcompress.js` 이미지 압축(SQImg)

### 데이터 (data)
- `site.json` `boards.json` `posts.json` `themes.json`
- 커스텀 테마는 RTDB/localStorage 의 `themes_custom` 노드

## 구현된 요구사항
1. 게시판 생성시 전용 HTML 자동 생성/다운로드 ✅ (skin.js genBoardHtml)
2. 용도(type)별 코드/주석 자동 삽입 ✅
3. 카드 스택 + 스냅 UI ✅ (home.css/board.css + GSAP)
4. 다중 테마 + 커스텀 프리셋 저장/백업 ✅
5. 미리보기/임시저장/서식/비밀글/수정/삭제/고정 ✅ (write.js)
6. 모노톤 회색 UI ✅ (tokens/themes)
7. 기본 게시판 6종(대문/공지/자유/메모/방명록/배너) ✅
8. Firebase 연동 + 튜토리얼 ✅ (docs/FIREBASE.md)
9. 초보자용 한국어 주석/직관 구조 ✅

## 다음 후보 작업
- Firebase Auth(익명 로그인)로 방명록 쓰기 보안 강화
- 댓글 기능, 검색/태그 필터
- 이미지 업로드를 Storage 로(현재 dataURL 인라인)
- 헤드리스 브라우저 E2E 테스트
