PEPE RESTAURANT WEBSITE 1.2.0 — DEPLOY

빠른 배포 추천 순서

1) Cloudflare Pages
- 새 Pages 프로젝트 생성
- 이 폴더 전체를 업로드
- Build command: 없음
- Output directory: /
- 배포 완료 후 Custom domains에서 본인 도메인 연결

2) Netlify
- 이 폴더를 Netlify Drop에 드래그
- netlify.toml이 포함되어 기본 보안 헤더가 적용됨
- Domain management에서 Custom domain 연결

3) GitHub Pages
- 저장소 루트에 이 파일들 업로드
- Settings → Pages → Deploy from branch
- main / root 선택
- 커스텀 도메인을 쓸 경우 CNAME 파일에 도메인만 한 줄 입력

필수 설정

config.js
- discordInvite: 실제 Discord 초대 링크
- discordGuildId: Discord 서버 Guild ID

Discord 실시간 인원
Discord → 서버 설정 → Widget → Enable Server Widget
그 후 Guild ID를 config.js에 넣기.
Widget이 꺼져 있으면 사이트는 자동으로 fallback 값 또는 "설정 필요"를 표시함.

운영진 수정
staff.json 수정.

공지/패치노트 수정
announcements.json 수정.
type 값:
- notice
- update
- minecraft

주의
index.html을 file:// 로 직접 열면 JSON fetch가 브라우저 보안 정책으로 막힐 수 있음.
완전한 기능 테스트는 간단한 로컬 서버 또는 실제 호스팅에서 확인:
  python3 -m http.server 8080
그 후 http://localhost:8080 접속.
