// 🐼 판다쌤 — 판다 논술 코칭 챗봇 (panda.html 전용, cg.js 다음에 로드)
// 서버: gas/Code.gs (Apps Script 웹앱). 대화 기록은 서버가 cellgen/chatLog/{반}/{학번}에 남기고, 여기서는 읽기만 한다.
// 사용: Coach.mount({ getDraft: () => ({ q1, ..., q5 }) })
(function () {
  var CHAT_URL = ''; // Apps Script 웹앱 배포 URL (…/exec)

  var css = '' +
    '.pc-fab{position:fixed;right:16px;bottom:16px;z-index:60;border:none;border-radius:999px;padding:12px 18px;background:var(--accent);color:#fff;font-weight:700;font-size:0.95rem;font-family:inherit;box-shadow:0 4px 14px rgba(0,0,0,.2);cursor:pointer}' +
    '.pc-panel{position:fixed;right:16px;bottom:16px;z-index:61;width:380px;max-width:calc(100vw - 32px);height:min(600px,calc(100vh - 32px));background:var(--surface,#fff);border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden}' +
    '.pc-panel.show{display:flex}' +
    '.pc-head{display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--accent);color:#fff}' +
    '.pc-head b{flex:1;font-size:0.95rem}' +
    '.pc-head button{border:none;background:rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:4px 10px;cursor:pointer;font-family:inherit}' +
    '.pc-note{font-size:0.72rem;color:var(--text-muted,#777);padding:6px 12px;background:#f6f8fc;line-height:1.45}' +
    '.pc-qs{display:flex;gap:4px;padding:8px 10px 0;flex-wrap:wrap}' +
    '.pc-qs button{border:1.5px solid var(--border,#dde3ea);background:#fff;border-radius:999px;padding:3px 10px;font-size:0.78rem;cursor:pointer;font-family:inherit}' +
    '.pc-qs button.on{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:700}' +
    '.pc-log{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px}' +
    '.pc-msg{max-width:88%;padding:8px 11px;border-radius:12px;font-size:0.86rem;line-height:1.55;white-space:pre-wrap;word-break:break-word}' +
    '.pc-msg.me{align-self:flex-end;background:var(--accent);color:#fff;border-bottom-right-radius:4px}' +
    '.pc-msg.bot{align-self:flex-start;background:#f1f3f8;border-bottom-left-radius:4px}' +
    '.pc-msg.err{align-self:center;background:#fff0f0;color:#c92a2a;font-size:0.8rem}' +
    '.pc-msg .qtag{display:inline-block;font-size:0.7rem;opacity:.8;margin-right:4px}' +
    '.pc-in{display:flex;gap:6px;padding:8px 10px;border-top:1px solid #eef1f7}' +
    '.pc-in textarea{flex:1;resize:none;border:1.5px solid var(--border,#dde3ea);border-radius:10px;padding:7px 9px;font-family:inherit;font-size:0.86rem;height:58px}' +
    '.pc-in button{border:none;border-radius:10px;background:var(--accent);color:#fff;font-weight:700;padding:0 14px;cursor:pointer;font-family:inherit}' +
    '.pc-in button:disabled{opacity:.5;cursor:default}' +
    '.pc-left{font-size:0.7rem;color:var(--text-muted,#777);text-align:right;padding:0 12px 6px}';

  function esc(s) { return DC.esc(s); }
  function fmt(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }

  window.Coach = {
    mount: function (opts) {
      var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      var fab = document.createElement('button');
      fab.className = 'pc-fab'; fab.textContent = '🐼 판다쌤에게 물어보기';
      var p = document.createElement('div');
      p.className = 'pc-panel';
      p.innerHTML = '<div class="pc-head"><b>🐼 판다쌤</b><button type="button" data-x>닫기</button></div>' +
        '<div class="pc-note">판다쌤은 답을 대신 써주지 않고 <b>질문으로 생각을 도와줘요.</b> 지금 쓰고 있는 답안을 판다쌤이 함께 읽어요. 대화 내용은 선생님도 볼 수 있어요.</div>' +
        '<div class="pc-qs">' + ['', '1', '2', '3', '4', '5'].map(function (q) { return '<button type="button" data-q="' + q + '"' + (q ? '' : ' class="on"') + '>' + (q ? q + '번' : '전체') + '</button>'; }).join('') + '</div>' +
        '<div class="pc-log"></div><div class="pc-left"></div>' +
        '<div class="pc-in"><textarea placeholder="어디서 막혔는지, 내 생각이 맞는지 물어봐요 (Enter 보내기, Shift+Enter 줄바꿈)"></textarea><button type="button">보내기</button></div>';
      document.body.appendChild(fab); document.body.appendChild(p);

      var log = p.querySelector('.pc-log'), ta = p.querySelector('textarea'), send = p.querySelector('.pc-in button'), left = p.querySelector('.pc-left');
      var curQ = '', busy = false, loaded = false;
      var disabled = DC.isGuest() ? '체험 모드에서는 판다쌤을 쓸 수 없어요. 학번으로 로그인해 주세요.' : (!CHAT_URL ? '판다쌤이 아직 준비 중이에요.' : '');

      function add(kind, text, q) {
        var d = document.createElement('div');
        d.className = 'pc-msg ' + kind;
        d.innerHTML = (q && kind === 'me' ? '<span class="qtag">[' + q + '번]</span>' : '') + (kind === 'bot' ? fmt(text) : esc(text));
        log.appendChild(d); log.scrollTop = log.scrollHeight;
        return d;
      }
      function loadHistory() {
        if (loaded) return; loaded = true;
        if (disabled) { add('err', disabled); ta.disabled = send.disabled = true; return; }
        DC.get('chatLog/' + DC.myBan() + '/' + DC.student.id).then(function (h) {
          var items = Object.keys(h || {}).map(function (k) { return h[k]; }).filter(Boolean).sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
          if (!items.length) add('bot', '안녕! 판다쌤이야 🐼 위에서 문항 번호를 고르고, 어디서 막혔는지 말해 줘. 답안을 먼저 써 두면 그걸 보고 같이 생각해 볼게!');
          items.forEach(function (x) { add('me', x.user, x.q); add('bot', x.reply); });
        }).catch(function () { add('bot', '안녕! 판다쌤이야 🐼 어디서 막혔는지 말해 줘.'); });
      }
      fab.onclick = function () { p.classList.add('show'); fab.style.display = 'none'; loadHistory(); setTimeout(function () { ta.focus(); }, 50); };
      p.querySelector('[data-x]').onclick = function () { p.classList.remove('show'); fab.style.display = ''; };
      p.querySelectorAll('.pc-qs button').forEach(function (b) {
        b.onclick = function () { curQ = b.dataset.q; p.querySelectorAll('.pc-qs button').forEach(function (x) { x.classList.toggle('on', x === b); }); ta.focus(); };
      });

      function submit() {
        var msg = ta.value.trim();
        if (!msg || busy || disabled) return;
        busy = true; send.disabled = true;
        add('me', msg, curQ); ta.value = '';
        var wait = add('bot', '판다쌤이 생각 중… 🐼');
        var draft = {};
        try { var v = opts.getDraft() || {}; ['q1', 'q2', 'q3', 'q4', 'q5'].forEach(function (k) { draft[k] = v[k] || ''; }); } catch (e) {}
        var body = JSON.stringify({ id: DC.student.id, name: DC.student.name, q: curQ, message: msg, draft: draft });
        // 서버의 모든 키가 한도에 걸렸으면(busy) 15초·30초·45초 기다렸다가 같은 질문을 자동으로 다시 보낸다
        function attempt(n) {
          return fetch(CHAT_URL, { method: 'POST', body: body }) // text/plain이라 사전 요청(CORS preflight) 없이 Apps Script로 바로 간다
            .then(function (r) { return r.json(); }).then(function (res) {
              if (!res.ok && res.busy && n < 3) {
                var sec = 15 * (n + 1);
                wait.textContent = '판다쌤이 지금 바빠요 😅 ' + sec + '초 뒤 자동으로 다시 보낼게요…';
                return new Promise(function (ok) { setTimeout(ok, sec * 1000); }).then(function () {
                  wait.textContent = '판다쌤이 생각 중… 🐼'; return attempt(n + 1);
                });
              }
              return res;
            });
        }
        attempt(0).then(function (res) {
          wait.remove();
          if (res.ok) { add('bot', res.reply); left.textContent = res.left === null || res.left === undefined ? '' : '오늘 남은 질문 ' + res.left + '번'; }
          else { add('err', res.error || '오류가 났어요.'); ta.value = ta.value || msg; }
        }).catch(function () {
          wait.remove(); add('err', '연결이 안 돼요. 인터넷을 확인하고 다시 보내 주세요.'); ta.value = ta.value || msg;
        }).then(function () { busy = false; send.disabled = false; ta.focus(); });
      }
      send.onclick = submit;
      ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); } });
    },
  };
})();
