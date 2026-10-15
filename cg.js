// 세포분열과 유전 표현하기 — 공용 라이브러리 (session.js 다음에 로드)
// digital-citizen/dc.js를 바탕으로, 수행평가(논술)용으로 줄이고 임시저장을 더했다.
//
// 데이터 경로: years/{year}/cellgen/{key}/{학년-반}/{studentId}
//   개인 응답 레코드 = { id, name, ban, num, answers:{fieldId:value}, updatedAt }
//   모둠 발표 자료   = show/{학년-반}/{모둠번호} = { media, members, link, mitosis, meiosis, lastEditor, lastEditorName, updatedAt }
//   교사 채점        = scores/{학년-반}/{studentId} = { panda, media, mitosis, meiosis, compare, memo, updatedAt }
//
// 페이지 쪽 사용 예:
//   <script src="session.js"></script><script src="cg.js"></script>
//   <script>
//   DC.start({ title: '...' }).then(() => {
//     DC.form({ mount: '#f1', key: 'panda', fields: [...] });
//   });
//   </script>
(function () {
  var DB_URL = 'https://gwangsu-on-default-rtdb.firebaseio.com';
  var ROOT = 'cellgen';
  var TEACHER_BAN = 'T'; // 교사 계정이 테스트로 쓴 응답은 'T' 반으로 저장

  var DC = window.DC = { DB_URL: DB_URL, cfg: null, student: null };
  DC.MEDIA = ['바이브코딩', '신체표현', '젤리활용'];
  DC.MEDIA_ICON = { '바이브코딩': '💻', '신체표현': '🤸', '젤리활용': '🍬' };
  DC.DIVS = ['체세포 분열', '생식세포 분열'];
  DC.DIV_ICON = { '체세포 분열': '🔵', '생식세포 분열': '🟣' };
  // 모둠 = 매체 × 분열 (3 × 2 = 6). 학생이 선착순으로 고른 칸이 곧 모둠이다.
  DC.SLOTS = [];
  [['vibe', '바이브코딩'], ['body', '신체표현'], ['jelly', '젤리활용']].forEach(function (m) {
    [['mitosis', '체세포 분열'], ['meiosis', '생식세포 분열']].forEach(function (d) {
      DC.SLOTS.push({ id: m[0] + '-' + d[0], media: m[1], div: d[1], no: DC.SLOTS.length + 1 });
    });
  });
  DC.GROUP_COUNT = DC.SLOTS.length;
  DC.slot = function (id) { return DC.SLOTS.filter(function (s) { return s.id === id; })[0] || null; };
  DC.slotLabel = function (id, withNo) {
    var s = DC.slot(id); if (!s) return '';
    return (withNo === false ? '' : s.no + '모둠 · ') + DC.MEDIA_ICON[s.media] + ' ' + s.media + ' · ' + DC.DIV_ICON[s.div] + ' ' + s.div;
  };
  // 선착순 순서: 서버 시각(ts) → 학번 순. picks = { studentId: {slot, ts, ...} }
  DC.slotMembers = function (picks, slotId) {
    return Object.keys(picks || {}).map(function (k) { var p = picks[k]; return p && Object.assign({ id: k }, p); })
      .filter(function (p) { return p && p.slot === slotId; })
      .sort(function (a, b) { return (a.ts - b.ts) || String(a.id).localeCompare(String(b.id)); });
  };
  // 선착순 설정: pickConfig/{반} = { open, cap } — cap이 없으면 반 인원 ÷ 6 올림
  DC.loadRosterCount = function (ban) {
    var p = String(ban).split('-');
    if (p.length !== 2) return Promise.resolve(0);
    return fetch(DB_URL + '/years/' + DC.cfg.year + '/students.json').then(function (r) { return r.json(); }).then(function (all) {
      return Object.keys(all || {}).filter(function (k) { return String(all[k].grade) === p[0] && String(all[k].ban) === p[1]; }).length;
    }).catch(function () { return 0; });
  };
  DC.defaultCap = function (n) { return n ? Math.ceil(n / DC.GROUP_COUNT) : 4; };
  DC.getMyPick = function () { return DC.get('pick/' + DC.myBan() + '/' + DC.student.id).catch(function () { return null; }); };

  // ---------- 유틸 ----------
  DC.esc = function (s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  DC.escAttr = function (s) { return DC.esc(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
  DC.nl2br = function (s) { return DC.esc(s).replace(/\n/g, '<br>'); };
  DC.fmtTime = function (ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  };

  // ---------- Firebase REST ----------
  DC.url = function (p) {
    var q = '', i = p.indexOf('?');
    if (i >= 0) { q = p.slice(i); p = p.slice(0, i); }
    return DB_URL + '/years/' + DC.cfg.year + '/' + ROOT + '/' + p + '.json' + q;
  };
  // 체험 모드: 쓰기는 이 탭의 메모리에만, 읽기는 서버 데이터 위에 메모리를 덮어쓴다.
  DC.isGuest = function () { return !!(DC.student && DC.student.isGuest); };
  var mem = {};
  function memSplit(p) { return p.split('?')[0].split('/').filter(Boolean); }
  function memGet(p) {
    var shallow = p.indexOf('shallow=true') >= 0, cur = mem;
    memSplit(p).forEach(function (k) { cur = (cur && typeof cur === 'object') ? cur[k] : undefined; });
    if (cur === undefined) return null;
    cur = JSON.parse(JSON.stringify(cur));
    if (shallow && cur && typeof cur === 'object') Object.keys(cur).forEach(function (k) { cur[k] = true; });
    return cur;
  }
  function memSet(p, v) {
    var ks = memSplit(p), last = ks.pop(), cur = mem;
    ks.forEach(function (k) { if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {}; cur = cur[k]; });
    if (v === null || v === undefined) delete cur[last];
    else cur[last] = JSON.parse(JSON.stringify(v));
  }
  function guestOp(fn) { return new Promise(function (res) { setTimeout(function () { res(fn()); }, 120); }); }
  function overlay(base, top) {
    if (top === null || top === undefined) return base;
    if (base === null || base === undefined || typeof base !== 'object' || typeof top !== 'object') return top;
    Object.keys(top).forEach(function (k) { base[k] = overlay(base[k], top[k]); });
    return base;
  }
  function realGet(p) {
    return fetch(DC.url(p)).then(function (r) { if (!r.ok) throw new Error('불러오기 실패'); return r.json(); });
  }
  DC.get = function (p) {
    if (DC.isGuest()) return realGet(p).catch(function () { return null; }).then(function (real) { return overlay(real, memGet(p)); });
    return realGet(p);
  };
  DC.put = function (p, v) {
    if (DC.isGuest()) return guestOp(function () { // 서버 시각 자리표시자는 체험 모드에서 지금 시각으로
      v = JSON.parse(JSON.stringify(v), function (k, x) { return x && typeof x === 'object' && x['.sv'] === 'timestamp' ? Date.now() : x; });
      memSet(p, v); return v;
    });
    return fetch(DC.url(p), { method: 'PUT', body: JSON.stringify(v) }).then(function (r) { if (!r.ok) throw new Error('저장 실패'); return r.json(); });
  };
  // 실시간 감시: Firebase REST 스트리밍(EventSource). 경로 아래가 바뀌면 곧바로 onChange()를 부른다.
  // 연결이 끊기면 브라우저가 알아서 다시 붙고, 지원하지 않는 환경이면 null을 돌려준다(그땐 폴링만 쓰면 됨).
  DC.listen = function (p, onChange) {
    if (!window.EventSource) return null;
    var es = new EventSource(DC.url(p)), t = null;
    var fire = function () { clearTimeout(t); t = setTimeout(onChange, 150); };
    es.addEventListener('put', fire);
    es.addEventListener('patch', fire);
    return es;
  };
  DC.del = function (p) {
    if (DC.isGuest()) return guestOp(function () { memSet(p, null); return null; });
    return fetch(DC.url(p), { method: 'DELETE' });
  };

  // 반 키 = '학년-반' (예: '3-2')
  DC.myBan = function () {
    if (DC.student.isGuest) return DC.student.grade + '-' + DC.student.ban;
    return DC.student.isTeacher ? TEACHER_BAN : (DC.student.grade + '-' + DC.student.ban);
  };
  DC.banLabel = function (b) { if (b === TEACHER_BAN) return '교사 테스트'; var p = String(b).split('-'); return p.length === 2 ? p[0] + '학년 ' + p[1] + '반' : b + '반'; };

  // ---------- 페이지 시작 ----------
  DC.start = function (opts) {
    opts = opts || {};
    if (opts.needLogin !== false) {
      DC.student = window.requireSrLogin();
      if (!DC.student) return new Promise(function () {});
    }
    return fetch(DB_URL + '/config/current.json').then(function (r) { return r.json(); }).then(function (cfg) {
      DC.cfg = cfg || { year: new Date().getFullYear(), sem: 2 };
      var head = document.getElementById('dc-head');
      if (head) {
        head.innerHTML =
          '<div class="header"><h1>' + DC.esc(opts.title || '세포분열과 유전 표현하기') + '</h1>' +
          (opts.subtitle ? '<p>' + DC.esc(opts.subtitle) + '</p>' : '') + '</div>' +
          (DC.student ? '<div class="who-banner"><span>✓ ' + DC.esc(window.srWhoLabel(DC.student)) + '</span>' +
            '<div class="links"><a href="index.html">← 활동 목록</a></div></div>' : '') +
          (DC.isGuest() ? '<div class="dc-guest-bar">🧪 <b>체험 모드</b> — 입력한 내용은 <b>서버에 저장되지 않아요.</b> 새로고침하면 사라져요.</div>' : '');
      }
      return DC.cfg;
    });
  };

  // ---------- 채점 기준표 ----------
  // rubric: [[점수, '기준'], ...]
  DC.rubricHtml = function (rubric, title) {
    if (!rubric || !rubric.length) return '';
    return '<details class="cg-rubric"><summary>' + DC.esc(title || '📋 평가 기준 보기') + '</summary><table>' +
      rubric.map(function (r) { return '<tr><td class="pt">' + DC.esc(r[0]) + '점</td><td>' + DC.esc(r[1]) + '</td></tr>'; }).join('') +
      '</table></details>';
  };

  // ---------- 입력 필드 ----------
  // field: { id, label, short, type, hint, placeholder, options, rows, pts(배점 배지), rubric, wrap(true면 문항 구분선),
  //          disabledOptions(선택 불가 옵션 배열), render(val,name)/read(root,name) (type:'custom') }
  // type: text | textarea | number | radio | info | custom
  function fieldHtml(formId, f, val) {
    var name = formId + '__' + f.id;
    if (f.type === 'info') return '<div class="dc-info">' + (f.html || DC.nl2br(f.label)) + '</div>';
    var h = '';
    if (f.pts) h += '<div class="cg-q-head"><label class="field-label">' + DC.esc(f.label) + '</label><span class="cg-pts">' + DC.esc(f.pts) + '</span></div>';
    else h += '<label class="field-label">' + DC.esc(f.label) + '</label>';
    if (f.hint) h += '<div class="dc-hint">' + DC.nl2br(f.hint) + '</div>';
    if (f.rubric) h += DC.rubricHtml(f.rubric);
    var ph = f.placeholder ? ' placeholder="' + DC.escAttr(f.placeholder) + '"' : '';
    var data = ' data-form="' + formId + '" data-fid="' + DC.escAttr(f.id) + '"';
    if (f.type === 'textarea') {
      h += '<textarea id="' + name + '"' + data + ' rows="' + (f.rows || 4) + '"' + ph + '>' + DC.esc(val || '') + '</textarea>' +
        '<div class="cg-count" data-count="' + name + '">' + String(val || '').length + '자</div>';
    } else if (f.type === 'text' || f.type === 'number') {
      h += '<input type="' + f.type + '" id="' + name + '"' + data + ph + ' value="' + DC.escAttr(val === undefined || val === null ? '' : val) + '">';
    } else if (f.type === 'radio') {
      h += '<div class="dc-choices' + (f.cls ? ' ' + f.cls : '') + '">';
      f.options.forEach(function (o) {
        var lab = f.labels ? f.labels[o] || o : o;
        h += '<label class="dc-choice"><input type="radio" name="' + name + '"' + data + ' value="' + DC.escAttr(o) + '"' + (String(val) === String(o) ? ' checked' : '') + '><span>' + DC.esc(lab) + '</span></label>';
      });
      h += '</div>';
    } else if (f.type === 'custom') {
      h += f.render(val, name);
    }
    return f.wrap ? '<div class="cg-q">' + h + '</div>' : h;
  }
  function readField(formId, f, root) {
    var name = formId + '__' + f.id;
    if (f.type === 'custom') return f.read(root, name);
    if (f.type === 'radio') {
      var c = root.querySelector('input[name="' + name + '"]:checked');
      return c ? c.value : '';
    }
    var el = root.querySelector('#' + CSS.escape(name));
    return el ? el.value.trim() : '';
  }
  DC.isEmpty = function (v) {
    if (v === undefined || v === null || v === '') return true;
    if (Array.isArray(v)) return !v.length;
    if (typeof v === 'object') return Object.keys(v).every(function (k) { return DC.isEmpty(v[k]); });
    return false;
  };
  DC.answerText = function (f, v) {
    if (DC.isEmpty(v)) return '';
    if (f.text) return f.text(v);
    if (f.labels && f.labels[v]) return f.labels[v];
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };
  DC.allFields = function (opts) {
    if (opts.fields) return opts.fields;
    var out = [];
    (opts.groups || []).forEach(function (g) { out = out.concat(g.fields); });
    return out;
  };
  function sameAns(a, b) { return JSON.stringify(a || {}) === JSON.stringify(b || {}); }

  // ---------- 개인 응답 폼 (논술) ----------
  // opts: { mount, key, groups:[{title, fields}] 또는 fields, title, hint, saveLabel, required:[id], validate(ans)→msg,
  //         onLoad(rec, api), onSaved(rec, api) }
  // 폴링하지 않는다(처음 1회 로드 + 저장 시 갱신). 입력하는 동안 이 기기에 임시저장(localStorage)해서
  // 실수로 창을 닫거나 크롬북이 꺼져도 다시 열면 이어 쓸 수 있다. 서버 저장에 성공하면 임시저장은 지운다.
  var formSeq = 0;
  DC.form = function (opts) {
    var root = typeof opts.mount === 'string' ? document.querySelector(opts.mount) : opts.mount;
    var formId = 'f' + (++formSeq);
    var fields = DC.allFields(opts);
    var path = opts.key + '/' + DC.myBan() + '/' + DC.student.id;
    var draftKey = 'cgDraft:' + DC.cfg.year + ':' + path;
    var api = { record: null, el: root, formId: formId };

    function readDraft() { try { return JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch (e) { return null; } }
    function writeDraft(ans) { try { localStorage.setItem(draftKey, JSON.stringify({ ans: ans, ts: Date.now() })); } catch (e) {} }
    function clearDraft() { try { localStorage.removeItem(draftKey); } catch (e) {} }

    root.innerHTML = '<div class="loading-state">불러오는 중...</div>';
    DC.get(path).then(function (rec) {
      api.record = rec;
      var ans = (rec && rec.answers) || {};
      var draft = readDraft(), restored = false;
      if (draft && draft.ans && draft.ts > ((rec && rec.updatedAt) || 0) && !sameAns(draft.ans, ans)) { ans = draft.ans; restored = true; }
      var body = '';
      if (opts.groups) {
        opts.groups.forEach(function (g) {
          body += '<div class="dc-group">' + (g.title ? '<div class="dc-group-title">' + DC.esc(g.title) + '</div>' : '') +
            g.fields.map(function (f) { return fieldHtml(formId, f, ans[f.id]); }).join('') + '</div>';
        });
      } else {
        body = fields.map(function (f) { return fieldHtml(formId, f, ans[f.id]); }).join('');
      }
      root.innerHTML = '<div class="card">' +
        (opts.title ? '<h2>' + DC.esc(opts.title) + '</h2>' : '') +
        (opts.hint ? '<p class="hint">' + DC.nl2br(opts.hint) + '</p>' : '') +
        (restored ? '<div class="cg-draft-note">📝 이 기기에 <b>서버에 아직 저장하지 않은 임시 내용</b>(' + DC.fmtTime(draft.ts) + ')이 있어 불러왔어요. 확인 후 꼭 <b>저장하기</b>를 눌러 주세요.</div>' : '') +
        body +
        '<div class="error-msg" id="' + formId + '_err"></div>' +
        '<div class="ok-msg" id="' + formId + '_ok"></div>' +
        '<button class="btn" id="' + formId + '_btn">' + DC.esc(opts.saveLabel || '💾 저장하기') + '</button>' +
        '<div class="dc-saved" id="' + formId + '_saved"></div>' +
        '</div>';
      renderSaved();
      document.getElementById(formId + '_btn').onclick = save;
      var t = null;
      var onEdit = function (e) {
        if (e.target.tagName === 'TEXTAREA') {
          var c = root.querySelector('[data-count="' + e.target.id + '"]');
          if (c) c.textContent = e.target.value.length + '자';
        }
        clearTimeout(t);
        t = setTimeout(function () { if (!DC.isGuest()) writeDraft(api.values()); }, 400);
      };
      root.addEventListener('input', onEdit);
      root.addEventListener('change', onEdit);
      if (opts.onLoad) opts.onLoad(rec, api);
    }).catch(function (e) { root.innerHTML = '<div class="error-msg show">' + DC.esc(e.message) + ' — 새로고침해 주세요.</div>'; });

    function renderSaved() {
      var box = document.getElementById(formId + '_saved');
      if (!box) return;
      var rec = api.record;
      var title = DC.isGuest() ? '🧪 체험 모드 (저장 안 됨)' : '💾 서버에 저장된 내용';
      if (!rec || !rec.answers) { box.innerHTML = '<div class="dc-saved-title">' + title + '</div><div class="dc-muted">아직 저장한 내용이 없어요.</div>'; return; }
      var rows = fields.filter(function (f) { return f.type !== 'info' && !DC.isEmpty(rec.answers[f.id]); }).map(function (f) {
        return '<div class="dc-saved-row"><b>' + DC.esc(f.short || f.label) + '</b><div>' + DC.nl2br(DC.answerText(f, rec.answers[f.id])) + '</div></div>';
      }).join('');
      box.innerHTML = '<div class="dc-saved-title">' + title + ' <span class="dc-muted">(' + DC.fmtTime(rec.updatedAt) + ')</span></div>' + rows;
    }
    api.values = function () {
      var ans = {};
      fields.forEach(function (f) { if (f.type !== 'info') ans[f.id] = readField(formId, f, root); });
      return ans;
    };
    function save() {
      var err = document.getElementById(formId + '_err'), ok = document.getElementById(formId + '_ok');
      err.classList.remove('show'); ok.classList.remove('show');
      var ans = api.values();
      var missing = (opts.required || []).filter(function (id) { return DC.isEmpty(ans[id]); });
      if (missing.length) {
        var labs = missing.map(function (id) { var f = fields.filter(function (x) { return x.id === id; })[0]; return f ? (f.short || f.label) : id; });
        err.textContent = '아직 비어 있는 칸이 있어요: ' + labs.join(', ');
        err.classList.add('show'); return;
      }
      if (opts.validate) { var msg = opts.validate(ans); if (msg) { err.textContent = msg; err.classList.add('show'); return; } }
      var btn = document.getElementById(formId + '_btn');
      btn.disabled = true; btn.textContent = '저장 중...';
      var s = DC.student;
      var rec = { id: s.id, name: s.name, ban: DC.myBan(), num: s.num || 0, answers: ans, updatedAt: Date.now() };
      DC.put(path, rec).then(function () {
        api.record = rec;
        if (!DC.isGuest()) clearDraft();
        var note = root.querySelector('.cg-draft-note'); if (note) note.remove();
        renderSaved();
        ok.textContent = DC.isGuest() ? '🧪 체험 모드라 서버에는 저장되지 않았어요.' : '저장되었어요! (' + DC.fmtTime(rec.updatedAt) + ') 끝날 때까지 몇 번이든 고쳐서 다시 저장할 수 있어요.';
        ok.classList.add('show');
        if (opts.onSaved) opts.onSaved(rec, api);
      }).catch(function (e) {
        err.textContent = e.message + ' — 인터넷 연결을 확인하고 다시 눌러 주세요. (쓴 내용은 이 기기에 임시저장되어 있어요)'; err.classList.add('show');
      }).then(function () { btn.disabled = false; btn.textContent = opts.saveLabel || '💾 저장하기'; });
    }
    return api;
  };
})();
