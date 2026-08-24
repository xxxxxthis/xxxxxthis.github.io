# PEPE ORIGINAL PLUGINS — JAR 검증 결과

홈페이지 1.4.2의 PEPE ORIGINAL PLUGINS 소개를 실제 JAR 구현 기준으로 갱신하기 위해 확인한 요약입니다.

- PepeAdminBridge 1.2.0: 온라인 플레이어 상세 상태/인벤토리 JSON 출력, request/response 파일 기반 kick·정확 슬롯 복제·제거 처리.
- PepeAuth 1.2.0: config 인증목록 기반 접속 제한, /인증관리, pepeauth.admin, pepeauth.bypass.
- PepeBedrock 1.2.0: Floodgate 런타임 연동, Bedrock 감지, Xbox 닉네임/Device OS 조회, 접속 안내, /베드락·/플랫폼·/베드락관리.
- PepeBridge 1.0.0: TPS와 온라인 플레이어 Java/Bedrock 플랫폼을 status.json에 기록, floodgate softdepend.
- PepeCore 1.2.1: 도움말·Discord·규칙·접속자, 입퇴장 메시지, 플러그인/화이트리스트/저장/종료 관리 명령.
- PepeDeath 1.2.0: 마지막 사망 위치 메모리 기록, 좌표 표시, /사망위치·/사망복귀.
- PepeServerFeatures 1.1.0: PepeAuth 인증목록 연동, 관리자/인증자/일반 등급, TAB 닉네임·헤더·푸터, 플레이타임/킬/데스, 발전과제 방송, /내정보·/인증기능.
- PepeServerSuite 1.2.6: 개인/전체 사이드바 설정 저장, 접속 인원·닉네임·핑·인증·플랫폼 표시, PepeAuth config 비동기 인증 확인, 서버 안내/인증 상태 명령.

외부 구성요소 floodgate / Geyser-Spigot은 PEPE ORIGINAL 쇼케이스에 포함하지 않았습니다.

Minecraft 버전 표시는 기존 정상 API `/api/public/status`의 `minecraft.version`을 계속 사용합니다. `/api/server-status` 호출은 추가하지 않았습니다.
