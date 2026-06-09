# STARQUAKE ARCADE

HTML · CSS · GSAP · JSON 기반의 **정적 개인 홈페이지**입니다.
서버나 빌드 도구 없이 파일만 올리면 동작하고, 원하면 Firebase로 여러 기기에 공유·배포할 수 있습니다.

> HTML을 몰라도 **스킨 에디터**와 **글쓰기 에디터**로 대부분을 마우스로 꾸밀 수 있게 만들었습니다.

## 주요 기능

- 🃏 **카드 스택 + 스냅 UI** — GSAP로 부드럽게 넘어가는 대문/게시판
- 🎨 **모노톤 테마 시스템** — 밝은~어두운 회색 프리셋 4종 + **나만의 커스텀 프리셋 저장**
- ✍️ **글쓰기 에디터** — 서식·정렬·색·표·이미지·링크·코드블록, **HTML 소스 편집**, **미리보기**, **자동 임시저장**, **비밀글 / 고정글 / 수정 / 삭제**
- 🧩 **스킨 에디터** — 사이트 설정·테마·게시판을 코딩 없이 편집, **프리셋 백업(내보내기/가져오기)**
- 🆕 **게시판 자동화** — 게시판을 만들면 **용도에 맞춘 전용 HTML 파일을 자동 생성**해 내려받기
- 👥 **회원 / 등급 시스템** — 회원가입·로그인 + 3등급(**최고 관리자·부관리자·회원**) 권한 세분화
- 🔥 **Firebase 연동(선택)** — 키 한 곳(`firebase-config.js`)만 채우면 RTDB, 비우면 localStorage 폴백
- 🧱 **Firebase 연동 전용 파일 분리** — 모든 Firebase 코드는 `assets/js/firebase.js` 한 곳에

## 기본 게시판

| id | 이름 | 종류 |
|------|------|------|
| home | 대문 | intro |
| notice | 공지 | list |
| free | 자유 | list |
| memo | 메모 | stream |
| guest | 방명록 | guest |
| banner | 배너 | banner |

## 빠른 시작

1. 이 폴더를 정적 서버로 엽니다(로컬 테스트):
   ```bash
   python3 -m http.server 8000
   # 브라우저에서 http://localhost:8000
   ```
   `fetch` 때문에 파일을 더블클릭(file://)하면 데이터가 안 보일 수 있으니 위처럼 서버로 여세요.
2. 우측 상단 **로그인** → **회원가입** (첫 가입자가 자동으로 **최고 관리자**가 됩니다)
3. **⚙ 스킨** 에서 제목·테마·게시판을 바꾸고 **저장**
4. **＋ 글쓰기** 로 글 작성
5. 배포 & 공유는 [`docs/FIREBASE.md`](docs/FIREBASE.md) 참고

### 등급별 권한
| 등급 | 권한 |
|------|------|
| 최고 관리자 | 모든 권한 — 회원 관리·사이트 설정·테마·게시판·모든 글 |
| 부관리자 | 게시판 관리 + 모든 글 작성·수정·삭제·고정 (회원/사이트 설정 제외) |
| 회원 | 본인 글 작성·수정·삭제, 방명록 작성 |

## 폴더 구조

```
index.html        대문(카드 스택)
board.html        만능 게시판 (?board=id, ?id=글)
write.html        글쓰기 에디터
editor.html       스킨 에디터 (+ 회원 관리)
account.html      로그인 / 회원가입 / 프로필
seed.html         Firebase 첫 데이터 업로드 도구
data/             site / boards / posts / themes (JSON 시드) — 직접 고쳐도 됨
assets/css/       tokens·base·layout + 페이지별 css
assets/js/        store · theme · app · auth · home · board · write · skin · account · imgcompress
assets/js/firebase-config.js   Firebase 키 (여기만 고침)
assets/js/firebase.js          Firebase 연동 전용 모듈
docs/FIREBASE.md  배포 튜토리얼
```

## 초보자를 위한 메모

- 색을 바꾸고 싶으면 → 스킨 에디터 **테마** 탭(또는 `data/themes.json`)
- 메뉴(게시판)를 바꾸고 싶으면 → 스킨 에디터 **게시판** 탭(또는 `data/boards.json`)
- 첫 화면 문구를 바꾸고 싶으면 → 스킨 에디터 **사이트** 탭(또는 `data/site.json`)
- 코드를 직접 만지고 싶으면 → 각 파일 맨 위 한국어 주석을 먼저 읽어보세요.
