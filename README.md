# 세포분열과 유전 표현하기

광수중학교 3학년 과학 2학기 수행평가 사이트 (GitHub Pages + Firebase Realtime Database).

- `index.html` — 학번·이름 로그인, 활동 목록
- `panda.html` — 활동 1: 마인크래프트 판다로 확인하는 멘델의 유전법칙 (결과 기록 + 토의 5문항, 유전의 원리 분석·도출 9점)
- `group-pick.html` — 활동 2-①: 매체(3)×분열(2) 6칸을 선착순으로 골라 모둠 편성 (서버 시각 순, 실시간)
- `division-show.html` — 활동 2-②: 모둠 세포분열 표현 자료 올리기·둘러보기
- `division-essay.html` — 활동 2-③: 개인 논술 (매체 활용 2 · 분열 과정 표현 4 · 특징 비교·분석 3)
- `teacher-groups.html` — 교사용 모둠 편성: 고르기 시작/마감(학생 화면에 즉시 반영), 정원, 이동, 자동 배정
- `teacher.html` — 교사용 채점·CSV
- `cg.js` — 공용 라이브러리 (Firebase REST, 개인 응답 폼, 임시저장)

데이터 경로: `years/{year}/cellgen/{panda|pick|pickConfig|essay|show|scores}/{학년-반}/...`
