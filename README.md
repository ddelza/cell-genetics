# 세포분열과 유전 표현하기

광수중학교 3학년 과학 2학기 수행평가 사이트 (GitHub Pages + Firebase Realtime Database).

- `index.html` — 학번·이름 로그인, 활동 목록
- `panda.html` — 활동 1: 마인크래프트 판다로 확인하는 멘델의 유전법칙 (결과 기록 + 토의 5문항, 유전의 원리 분석·도출 9점)
- `division-show.html` — 활동 2-①: 모둠 세포분열 표현 자료 올리기·둘러보기
- `division-essay.html` — 활동 2-②: 개인 논술 (매체 활용 2 · 분열 과정 표현 4 · 특징 비교·분석 3)
- `teacher.html` — 교사용 채점·CSV
- `cg.js` — 공용 라이브러리 (Firebase REST, 개인 응답 폼, 임시저장)

데이터 경로: `years/{year}/cellgen/{panda|essay|show|scores}/{학년-반}/...`
