# STARQUAKE ARCADE — memo

## 완료 작업
- 메인 `@ST4RQUADE` → `pages/write.html` 링크
- 에디터 페이지 (cookiejar 기능, POST UI, Firebase `posts` 노드)
- 캘린더 페이지 (DAILY/MONTHLY, cookiejar 기능, Firebase `calendar` 노드)
- 공통: loader, page-shell(타이틀 애니메이션·스크롤 잠금), nav ARCHIVE
- `seed.html`에 posts/calendar 노드 추가

## 현재 상태
- 에디터: SQPosts + SQImg + editor.js 동작
- 캘린더: 일정 CRUD·반복·완료체크·JSON 가져오기/보내기
- ARCHIVE 페이지는 허브 플레이스홀더

## 수정 파일
- `index.html`, `assets/css/home.css`
- `pages/write.html`, `pages/calendar.html`, `pages/archive.html`
- `assets/css/editor.css`, `calendar.css`, `loader.css`, `layout.css`, `tokens.css`
- `assets/js/editor.js`, `posts.js`, `imgcompress.js`, `calendar.js`, `page-shell.js`, `app.js`
- `data/posts.json`, `data/calendar.json`
- `seed.html`, `memo.md`

## 알려진 이슈
- 캘린더 월 이동 UI 없음(모킹 기준)
- `cursor-source/fonts` 폴더 없음 → CDN 폰트 사용

## 다음 작업
- 나머지 페이지 모킹 (LOG, MEMO, GUEST, BANNER, ARCHIVE 리스트 등)
- RTDB 시드 갱신
