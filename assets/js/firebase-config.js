/* =====================================================================
 * firebase-config.js — Firebase 키 (이 파일만 고치면 됩니다)
 * ---------------------------------------------------------------------
 * 이 사이트는 Realtime Database(RTDB) 를 사용합니다.
 * 따라서 아래 databaseURL 이 반드시 필요합니다(웹 설정에는 기본 미포함).
 *
 * databaseURL 확인 방법:
 *   1) Firebase 콘솔 → 빌드 → Realtime Database → "데이터베이스 만들기"
 *   2) 만들면 화면 상단에 https://....firebasedatabase.app 주소가 보입니다.
 *      그 주소를 아래 databaseURL 에 그대로 붙여넣으세요.
 *   · 미국(us-central1):  https://<프로젝트>-default-rtdb.firebaseio.com
 *   · 그 외 리전:         https://<프로젝트>-default-rtdb.<리전>.firebasedatabase.app
 *
 * 자세한 배포 순서: docs/FIREBASE.md
 * ===================================================================== */
window.SQ_FIREBASE = {
  apiKey: "AIzaSyBZB39jxpd6_zgbMYlYX_tlsSDshXgGgXQ",
  authDomain: "preview-85921.firebaseapp.com",
  // 아시아(asia-southeast1) 리전 RTDB 주소
  databaseURL: "https://preview-85921-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "preview-85921",
  storageBucket: "preview-85921.firebasestorage.app",
  messagingSenderId: "477292162467",
  appId: "1:477292162467:web:9bbc9cfa774ef9e1a43e16"
};
