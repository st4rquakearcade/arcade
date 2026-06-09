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

## 2차 업데이트
- 무한 로딩 수정: store.js withTimeout(5s) + app.js 로더 7s 안전장치, firebase-config 기본값을 빈 플레이스홀더로
- 회원가입/로그인: auth.js(SQAuth) + account.html/account.js, users 노드
- 등급/권한: 최고관리자/부관리자/회원 3단계 + 세분 권한(PERMS), 스킨 에디터 회원 탭
- 권한 연동: write.js(작성/수정 가드·옵션), board.js(쓰기/수정/삭제·소유권), editor 탭별 권한
- Firebase 연동 전용 파일 분리: db.js → firebase.js (config 는 firebase-config.js 한 곳)

## 3차 업데이트 (디자인 + 기능)
- 스타일 프리셋화: 색+글꼴+라운드+테두리 토큰 전체를 프리셋이 제어
  (editorial/soft/arcade/brutal, 모두 모노톤+포인트1색), themes.json/tokens.css 확장
- Google Fonts 관리: fonts.js(SQFont) + 스킨 에디터 폰트 탭, site.fonts 오버라이드
- 게시판 타입 추가: gallery, faq
- 보기 형태 추가: cards/compact/magazine/grid (board.view), board.js 렌더 분기
- 애니메이션 라이브러리: anim.js + Lenis 부드러운 스크롤 + [data-reveal] 등장
- 스킨 에디터: 게시판 행 한 줄 정렬·아이콘 버튼, "관리자만" 라벨,
  버튼 "게시판 생성"(자동 다운로드 제거, ⬇는 행별 버튼)
- 포인트색(--accent)·테두리두께(--border-w)·폰트 토큰을 base/layout/home/board 에 반영

## 다음 후보 작업
- Firebase Auth(익명 로그인)로 방명록 쓰기 보안 강화
- 댓글 기능, 검색/태그 필터
- 이미지 업로드를 Storage 로(현재 dataURL 인라인)
- 헤드리스 브라우저 E2E 테스트
