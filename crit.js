// 세포분열과 유전 표현하기 — 채점 항목 + 실전(구글폼) 응답 해석 (teacher.html · my-score.html 공용, cg.js 다음에 로드)
(function () {
// 채점 항목 — 유전(판다) 9 + 세포분열 논술 9 + 활동 돌아보기 5 + 동료평가 2 = 25점(평가계획 총점).
// 판다 논술은 2번(어버이 순종 교배 설명, 관찰 결과 서술)만 1점, 나머지 4문항은 2점 → 9점(2026-10-28).
// 실전(구글폼) 답으로 채점하고, 연습 답은 회색으로 참고만.
// min: 최하점(없으면 0). 판다 1·4번, 비교·분석, 삶 영향, 동료평가는 평가계획상 최하점 1점(2026-10-29) — 채점 버튼도 1점부터.
DC.CRIT = [
  { id: 'p1', label: '1. 더 의미 있는 결과와 그 이유', short: '판다1', min: 1, max: 2, src: 'panda',
    rubric: [['', [[2,"반 전체 또는 우리 모둠 중 하나를 고르고 타당한 근거를 제시함 — (가) 반 전체: 표본이 많을수록 우연의 영향이 줄어 기댓값(3:1)에 가까워짐 / (나) 우리 모둠: 두 결과의 비율을 계산해 모둠 쪽이 실제로 3:1에 더 가까웠음을 근거로 듦"],[1, "선택은 했으나 근거가 막연하거나 일부만 맞음 (예: \"수가 많아서\"만 쓰고 왜 그런지 없음, 비율 비교가 틀림) · 무응답이거나 근거가 없어도 최하점 1점"]]]],
    key: '(가) 반 전체: 표본이 많을수록 우연에 의한 오차가 줄어 이론적인 비(3:1)에 가까워짐<br>(나) 우리 모둠: 모둠 결과가 반 전체보다 실제로 3:1에 더 가까웠다면 그 비교를 근거로 모둠이 더 의미 있다고 해도 인정',
    fields: [["counts","모의 실험 결과"],["q1","1. 더 의미 있는 결과와 그 이유"]] },
  { id: 'p2', label: '2. 어버이 순종 교배 설명', short: '판다2', max: 1, src: 'panda',
    rubric: [['', [[1,"교배 대상(검정 순종 × 갈색 순종)과 결과(자손 1대가 모두 검정)를 모두 정확히 씀"],[0,"교배 대상이나 결과 중 하나라도 빠지거나 틀림, 또는 무응답"]]]],
    key: '검정 순종(BB) × 갈색 순종(bb) → 자손 1대는 모두 검정(Bb)',
    fields: [["q2","2. 어버이 순종 교배 설명"]] },
  { id: 'p3', label: '3. 어버이 순종 교배로 추측할 수 있는 것', short: '판다3', max: 2, src: 'panda',
    rubric: [['', [[2,"자손 1대가 갈색 유전자를 가졌는데도 모두 검정으로 나타난 것을 근거로 검정이 우성(갈색이 열성)임을 추론함"],[1,"우성·열성을 언급했으나 근거(자손 1대가 모두 검정)가 없거나 우열 관계 서술이 일부 부정확함"],[0,"무응답이거나 우열 관계를 반대로 씀"]]]],
    key: '검정이 갈색에 대해 우성 — 잡종에서는 우성 형질만 나타남(우열의 원리)',
    fields: [["q3","3. 어버이 순종 교배로 추측할 수 있는 것"]] },
  { id: 'p4', label: '4. 자손 1대 잡종 교배 설명(정수비 포함)', short: '판다4', min: 1, max: 2, src: 'panda',
    rubric: [['', [[2,"검정 잡종(Bb)끼리 교배하여 자손 2대에서 검정 : 갈색이 약 3 : 1로 나왔음을 씀 (결과만 써도 만점, 반 전체 숫자·비율이 있으면 더 좋음)"],[1, "교배 대상 또는 정수비 중 하나가 빠지거나 비율이 부정확함 · 무응답이거나 결과가 틀려도 최하점 1점"]]]],
    key: '검정 잡종(Bb)끼리 교배 → 자손 2대 검정 : 갈색 ≈ 3 : 1',
    fields: [["q4","4. 자손 1대 잡종 교배 설명(정수비 포함)"]] },
  { id: 'p5', label: '5. 자손 2대 정수비의 의미', short: '판다5', max: 2, src: 'panda',
    rubric: [['', [[2,"다음 중 하나를 정확히 씀 — (가) 자손 2대 유전자형이 BB, Bb, Bb, bb로 나와 검정 : 갈색 = 3 : 1이 됨 / (나) 분리의 법칙: 생식세포가 형성될 때 대립유전자가 분리되어 서로 다른 생식세포로 들어감"],[1,"(가) 또는 (나)를 언급했으나 경우의 수나 정의가 불완전·부정확함"],[0,"무응답이거나 정수비의 의미와 관계없는 내용"]]]],
    key: '둘 중 하나면 만점 — (가) BB, Bb, Bb, bb → 검정 : 갈색 = 3 : 1 / (나) 생식세포가 형성될 때 대립유전자가 분리되어 서로 다른 생식세포로 들어감(분리의 법칙)',
    fields: [["q5","5. 자손 2대 정수비의 의미"]] },
  { id: 'media', label: '매체 활용의 적절성 설명하기', short: '매체 활용', max: 2, src: 'essay',
    rubric: [['', [[2, '매체가 분열 과정 설명에 적절한 이유를 과학적으로 제시 + 모형과 실제 세포 분열의 차이점(한계점)을 명확히 설명'], [1, '매체 선택 이유는 제시했으나 실제 현상과의 차이점 설명이 부족·추상적'], [0, '매체 활용 설명이나 실제 현상과의 비교 분석이 거의 없음']]]],
    fields: [['mySlot', '우리 모둠'], ['q1Why', '① 매체가 적절한 이유'], ['q1Limit', '② 실제 현상과의 차이점(한계점)']] },
  { id: 'mitosis', label: '세포분열 과정 표현 — 체세포 분열', short: '체세포', max: 2, src: 'essay',
    rubric: [['', [[2, '각 단계(전·중·후·말기)에서 염색체의 복제 및 분리 행동을 과학적 오류 없이 정확하게 표현'], [1, '주요 흐름은 나타나나 일부 단계에서 행동 표현이 불분명']]]],
    fields: [['otherMedia', '문항 2에서 고른 매체'], ['q2Mitosis', '체세포 분열 표현']] },
  { id: 'meiosis', label: '세포분열 과정 표현 — 감수 분열', short: '감수', max: 2, src: 'essay',
    rubric: [['', [[2, '감수 분열만의 고유한 특징을 생물학적으로 타당하게 구현하여 체세포 분열과의 차이가 뚜렷함'], [1, '감수 분열만의 고유한 특징이 일부만 나타나거나 표현이 미흡']]]],
    key: '상동 염색체 접합(2가 염색체), 1분열에서 상동 염색체 분리, 2회 연속 분열(2분열 전 DNA 복제 없음), 염색체 수 반감(2n→n), 딸세포 4개',
    fields: [['otherMedia', '문항 2에서 고른 매체'], ['q2Meiosis', '감수 분열 표현']] },
  { id: 'compare', label: '각 분열의 특징 비교·분석하기', short: '비교·분석', min: 1, max: 3, src: 'essay',
    rubric: [['', [[3, '①과정의 차이 ②분열의 목적 ③분열의 결과 3가지 관점 모두 명확히 비교·분석'], [2, '2가지 관점'], [1, '1가지 관점 · 비교·분석이 미흡하거나 없어도 최하점 1점']]]],
    key: '① 과정: 체세포 1회 분열·상동 염색체 접합 없음 / 감수 2회 연속 분열·상동 염색체 접합 후 분리<br>② 목적: 생장·재생 / 생식세포 형성<br>③ 결과: 딸세포 2개·염색체 수 변화 없음(2n→2n) / 딸세포 4개·염색체 수 반감(2n→n)',
    fields: [['q3', '체세포 분열 vs 감수 분열']] },
  { id: 'fact', label: '4-① 활동으로 알게 된 흥미로운 사실', short: '흥미 사실', max: 2, src: 'essay',
    rubric: [['', [[2, '단원 활동으로 알게 된 과학적 사실을 구체적으로 제시하고 흥미로운 까닭을 설명'], [1, '사실은 제시했으나 막연하거나 부정확, 또는 흥미로운 까닭이 없음'], [0, '알게 된 사실을 제시하지 않음']]]],
    fields: [['q4Fact', '4-① 알게 된 흥미로운 사실']] },
  { id: 'life', label: '4-② 나의 삶에 미칠 영향', short: '삶 영향', min: 1, max: 3, src: 'essay',
    rubric: [['', [[3, '알게 된 사실을 나의 삶과 구체적으로 연결해 앞으로의 생각·행동 변화를 근거를 들어 설명'], [2, '삶과 연결했으나 근거나 구체성이 다소 부족'], [1, '삶에 미칠 영향을 막연하게만 언급 · 삶과의 연결이 없어도 최하점 1점']]]],
    fields: [['q4Life', '4-② 나의 삶에 미칠 영향']] },
  { id: 'peer', label: '모둠 발표 동료평가', short: '동료평가', min: 1, max: 2, src: 'peer',
    rubric: [['', [[2, '자기 모둠을 뺀 모든 모둠을 평가하고, 기억에 남는 단계를 어떻게 표현했는지(또는 까닭)를 구체적으로 씀'], [1, '일부 모둠만 평가했거나 서술이 막연함 · 동료평가에 참여하지 않아도 최하점 1점']]]],
    fields: [] },
];

// ---------- 실전(구글폼 시험 모드) 응답 시트 해석 ----------
// Apps Script가 돌려준 { header, rows }를 머리글 글자로 해석한다 (폼 문항 순서가 바뀌어도 안전).
// 같은 학생이 여러 번 냈으면 마지막 것. 돌려주는 값: { out: 학번 → 레코드, miss: 못 찾은 열 }
var col = function (H, re) { return H.findIndex(function (h) { return re.test(String(h).trim()); }); };
var cell = function (row, i) { return i >= 0 && row[i] !== undefined && row[i] !== null ? String(row[i]).trim() : ''; };
var tsOf = function (row) { return typeof row[0] === 'number' ? row[0] : 0; };

// 판다: 학번 → { ts, name, team, role, q1~q5, counts:{gb,gr,cb,cr} }
DC.parsePandaReal = function (r) {
  var H = r.header || [], C = { sid: col(H, /학번/), name: col(H, /이름/), team: col(H, /모둠\s*번호/), role: col(H, /역할/), email: col(H, /이메일|email/i),
    gb: col(H, /우리\s*모둠.*검정/), gr: col(H, /우리\s*모둠.*갈색/), cb: col(H, /반\s*전체.*검정/), cr: col(H, /반\s*전체.*갈색/) };
  [1, 2, 3, 4, 5].forEach(function (n) { C['q' + n] = col(H, new RegExp('^\\s*' + n + '\\s*[.)]')); });
  var out = {};
  (r.rows || []).forEach(function (row) {
    var g = function (k) { return cell(row, C[k]); };
    var sid = g('sid').replace(/\D/g, '');
    if (sid.length !== 4) sid = (g('email').match(/\d{4}/) || [''])[0];
    if (sid.length !== 4 || (out[sid] && out[sid].ts > tsOf(row))) return;
    out[sid] = { ts: tsOf(row), name: g('name'), team: g('team'), role: g('role'), q1: g('q1'), q2: g('q2'), q3: g('q3'), q4: g('q4'), q5: g('q5'),
      counts: { gb: g('gb'), gr: g('gr'), cb: g('cb'), cr: g('cr') } };
  });
  // 모둠 번호·이름·이메일은 폼에 없어도 됨
  return { out: out, miss: Object.keys(C).filter(function (k) { return C[k] < 0 && ['email', 'name', 'team'].indexOf(k) < 0; }) };
};

// 세포분열: 학번 → { ts, name, answers } — answers는 연습(essay/{반}/{학번}.answers)과 같은 키라 CRIT.fields를 그대로 쓴다
DC.parseDivReal = function (r) {
  var H = r.header || [], C = { sid: col(H, /학번/), name: col(H, /^이름/), slot: col(H, /^우리\s*모둠$/), q1Why: col(H, /^1-①/), q1Limit: col(H, /^1-②/),
    q2Mitosis: col(H, /^2-①/), q2Meiosis: col(H, /^2-②/), q3: col(H, /^3\./), q4Fact: col(H, /^4-①/), q4Life: col(H, /^4-②/) };
  // 우리 모둠 매체별 갈림길이라 '표현할 매체' 열이 3개 있고 그중 하나만 채워짐
  var mediaCols = H.map(function (h, i) { return /표현할\s*매체/.test(h) ? i : -1; }).filter(function (i) { return i >= 0; });
  var out = {};
  (r.rows || []).forEach(function (row) {
    var g = function (k) { return cell(row, C[k]); };
    var sid = g('sid').replace(/\D/g, '');
    if (sid.length !== 4 || (out[sid] && out[sid].ts > tsOf(row))) return;
    var sl = DC.SLOTS.filter(function (x) { return x.no === parseInt(g('slot'), 10); })[0]; // "3모둠 · 🤸 신체표현 · 🔵 체세포 분열"
    var other = mediaCols.map(function (i) { return cell(row, i); }).filter(Boolean)[0] || '';
    var a = { mySlot: sl ? sl.id : '', myMedia: sl ? sl.media : '', myDivision: sl ? sl.div : '', otherMedia: other.replace(/^[^가-힣]+/, '') };
    ['q1Why', 'q1Limit', 'q2Mitosis', 'q2Meiosis', 'q3', 'q4Fact', 'q4Life'].forEach(function (k) { a[k] = g(k); });
    out[sid] = { ts: tsOf(row), name: g('name'), answers: a };
  });
  return { out: out, miss: Object.keys(C).filter(function (k) { return C[k] < 0; }).concat(mediaCols.length ? [] : ['otherMedia']) };
};
})();
