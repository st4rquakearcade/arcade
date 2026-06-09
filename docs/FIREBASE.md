# Firebase 연동 & 배포 튜토리얼

이 사이트는 **Firebase 없이도** 동작합니다(브라우저 localStorage 사용, 혼자 보기용).
여러 기기에서 글을 공유하고 인터넷에 배포하려면 아래 순서대로 Firebase를 연결하세요.

---

## 1. Firebase 프로젝트 만들기

1. <https://console.firebase.google.com> 접속 → **프로젝트 추가**
2. 프로젝트 이름 입력(예: `my-arcade`) → 계속 → 만들기

## 2. Realtime Database 켜기

1. 왼쪽 메뉴 **빌드 → Realtime Database** → **데이터베이스 만들기**
2. 위치 선택(예: `asia-southeast1`)
3. 보안 규칙은 일단 **테스트 모드**로 시작 → 사용 설정

## 3. 웹 앱 등록 & 설정 키 복사

1. 프로젝트 개요 옆 **⚙ → 프로젝트 설정**
2. 아래 **내 앱**에서 **웹(`</>`)** 아이콘 클릭 → 앱 닉네임 입력 → 등록
3. 표시되는 `firebaseConfig` 값을 복사

## 4. 키 붙여넣기

`assets/js/firebase-config.js` 를 열어 값을 교체합니다.

```js
window.SQ_FIREBASE = {
  apiKey: "복사한 값",
  authDomain: "...",
  databaseURL: "https://....firebasedatabase.app", // ← 이 값이 꼭 있어야 합니다
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

> `databaseURL` 이 비어 있으면 Realtime Database가 연결되지 않습니다.

## 5. 시드(첫 데이터) 올리기

배포한 사이트에서 `seed.html` 을 엽니다(예: `https://내사이트/seed.html`).
**JSON → RTDB 업로드** 버튼을 누르면 `/data/*.json` 의 기본 데이터가 올라갑니다.
(이미 데이터가 있으면 덮어쓰므로 처음 한 번만 사용하세요.)

## 6. 보안 규칙 설정 (중요)

테스트 모드는 30일 뒤 누구나 쓰기가 막힙니다. 개인 홈페이지라면 보통
**읽기는 모두 / 쓰기는 인증된 사용자만** 으로 둡니다.

Realtime Database → **규칙** 탭:

```json
{
  "rules": {
    ".read": true,
    ".write": "auth != null"
  }
}
```

- 화면의 **주인 PIN**(스킨 에디터에서 설정)은 *버튼을 보이게 하는 잠금*일 뿐
  진짜 보안이 아닙니다. 실제로 아무나 못 쓰게 막는 것은 위 **규칙**입니다.
- 방명록처럼 방문자도 쓰게 하려면 `".write": true` 로 열되,
  스팸을 감안하세요. 또는 Firebase Authentication(익명 로그인)을 붙일 수 있습니다.

---

## 7. 배포하기

### 방법 A — Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # public 디렉터리를 "." (현재 폴더)로 지정, SPA 아니오
firebase deploy
```

### 방법 B — GitHub Pages

1. 이 저장소를 GitHub에 푸시
2. 저장소 **Settings → Pages** → Source를 `main` 브랜치 `/ (root)` 로 지정
3. 잠시 뒤 `https://<사용자>.github.io/<저장소>/` 에서 열림

> 정적 파일만 있으므로 어떤 정적 호스팅(Netlify, Vercel, Cloudflare Pages)에도 그대로 올라갑니다.

---

## 데이터 구조 한눈에

| 노드 | 내용 | 파일(시드) |
|------|------|-----------|
| `site` | 제목·핸들·소개·테마·PIN | `data/site.json` |
| `boards` | 게시판 목록/순서/종류 | `data/boards.json` |
| `posts` | 모든 글(게시판은 `board` 필드로 구분) | `data/posts.json` |
| `themes_custom` | 스킨 에디터에서 만든 커스텀 테마 | (없음, 앱이 생성) |

빌트인 테마는 `data/themes.json`(읽기 전용 파일)에 있습니다.
