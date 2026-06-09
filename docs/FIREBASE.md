# Firebase 연동 & 배포 튜토리얼

이 사이트는 **Firebase 없이도** 동작합니다(브라우저 localStorage 사용, 혼자 보기용).
여러 기기에서 글·회원을 공유하고 인터넷에 배포하려면 아래 순서대로 Firebase를 연결하세요.

## Firebase 관련 파일 (2개뿐)

| 파일 | 역할 | 내가 고치나? |
|------|------|------|
| `assets/js/firebase-config.js` | **키만** 들어있는 설정 파일 | ✅ 여기만 고침 |
| `assets/js/firebase.js` | 연동 로직(전용) — 나머지 앱은 Firebase를 직접 모름 | ❌ 보통 안 건드림 |

기본 상태에서 `firebase-config.js` 는 비어 있어 Firebase가 꺼져 있고(localStorage 동작),
키를 채우는 순간 자동으로 켜집니다. `firebase.js` 를 지워도 사이트는 그대로 동작합니다.

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

- 이 사이트의 **회원/등급 시스템(로그인)** 은 앱 수준 잠금입니다. 비밀번호는
  브라우저에서 SHA-256 해시해 저장하지만, DB를 읽을 수 있으면 해시도 보입니다.
  즉 *진짜 보안이 아니라 편의 기능*입니다. 민감한 서비스라면 위 규칙으로 쓰기를 막고,
  필요하면 **Firebase Authentication**(이메일/비밀번호·익명 로그인)으로 교체하세요.
  (데이터 모델을 `users` 노드 + `auth.js` 로 분리해 두어 교체가 쉽습니다.)
- 방명록처럼 방문자도 쓰게 하려면 `".write": true` 로 열되 스팸을 감안하세요.

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
| `users` | 회원·등급(최고관리자/부관리자/회원) | (없음, 회원가입 시 생성) |
| `themes_custom` | 스킨 에디터에서 만든 커스텀 테마 | (없음, 앱이 생성) |

> 첫 번째로 **회원가입**한 사람이 자동으로 **최고 관리자**가 됩니다.
> Firebase를 켠 뒤에는 다시 한 번 가입해 그 환경의 최고 관리자를 만드세요.

빌트인 테마는 `data/themes.json`(읽기 전용 파일)에 있습니다.
