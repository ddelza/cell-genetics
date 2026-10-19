/**
 * 판다 실전 논술(구글폼 시험 모드) 응답 시트 읽기 전용 웹앱
 * — 응답 시트(학교 계정 소유)에 붙여서 학교 계정으로 배포한다. teacher.html이 ?action=essays&pw=… 로 읽어 간다.
 *   (판다쌤 챗봇 서버는 다른 계정이라 학교 계정 시트를 열 권한이 없어서 따로 둔다)
 *
 * 설치: 응답 시트 > 확장 프로그램 > Apps Script → 이 코드 붙여넣기 → 저장
 *       → 배포 > 새 배포 > 웹 앱 / 실행: 나 / 액세스: 모든 사용자 → /exec 주소를 teacher.html의 ESSAY_URL에
 */
const ESSAY_SHEET_ID = '18B-5XHxYmU6JHCGdIJqZW2zCsRGhCy_Jm8B4LdGHpEw';
const ESSAY_GID = 1522610830;
const TEACHER_PW = 'byung0703!'; // teacher.html과 같은 비밀번호

function doGet(e) {
  const p = (e && e.parameter) || {};
  let out;
  if (p.action !== 'essays') out = { ok: true, service: 'panda-essays' };
  else if (p.pw !== TEACHER_PW) out = { ok: false, error: '비밀번호가 다릅니다' };
  else {
    try { out = readEssays(); } catch (err) { out = { ok: false, error: String(err.message || err) }; }
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// 머리글 + 행 그대로 돌려준다 (열 해석은 teacher.html에서 머리글 글자로 — 폼 문항 순서가 바뀌어도 안전)
function readEssays() {
  const ss = SpreadsheetApp.openById(ESSAY_SHEET_ID);
  const sh = ss.getSheets().filter(x => x.getSheetId() === ESSAY_GID)[0] || ss.getSheets()[0];
  const v = sh.getDataRange().getValues();
  const fix = x => x instanceof Date ? x.getTime() : (x === null || x === undefined ? '' : x);
  return { ok: true, header: (v[0] || []).map(String), rows: v.slice(1).map(r => r.map(fix)) };
}

// 편집기에서 실행해 권한 승인 + 확인용
function testRead() { const r = readEssays(); Logger.log(r.header.join(' | ') + '\n응답 ' + r.rows.length + '건'); }
