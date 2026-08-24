# 🐸 PEPE RESTAURANT

> **우리 서버를 위해 직접 만듭니다.**

PEPE RESTAURANT 커뮤니티의 공식 홈페이지입니다.  
Discord와 Minecraft를 연결하는 인증 시스템부터 서버 상태, 공지사항, 초대 요청, 자체 제작 봇과 운영 시스템 소개까지 한곳에서 제공합니다.

🌐 **Website:** https://xxxxxthis.github.io/

---

## ✨ 주요 기능

> Website **1.5.0 · PEPE LIVE** — Minecraft 정보를 전용 `minecraft.html` 페이지로 분리하고 LIVE STATUS, 접속자, 서버 통계, 랭킹 UI를 확장했습니다.

### ⛏️ PEPE Minecraft

Java Edition과 Bedrock Edition의 Crossplay를 지원하는 PEPE 전용 Minecraft 서버입니다.

- Java + Bedrock Crossplay
- Discord ↔ Minecraft 인증
- 승인된 멤버 전용 서버 접속 정보
- Java / Bedrock 실시간 온라인 상태
- 서버 버전 실시간 표시
- 접속자 · TPS · 서버 상태 연동
- Minecraft 서버 기능 소개 팝업

서버 주소는 공개 저장소에 포함하지 않으며, 승인된 사용자가 홈페이지에서 인증을 완료한 경우에만 API를 통해 제공합니다.

### 🛡️ PEPE MANAGER

PEPE RESTAURANT를 위해 직접 설계·개발한 통합 관리 봇입니다.

- 서버 및 유저 관리
- Discord ↔ Minecraft 인증
- 역할 관리
- 활동 · XP · 레벨 · 랭킹
- 티켓 · 문의 · 신고 · 지원
- 운영 자동화
- 홈페이지 API
- Discord 공지 자동 연동
- 관리자 대시보드

### 🤖 꼬붕봇

커뮤니티에서 사용하는 다양한 편의 기능을 제공하는 PEPE 전용 봇입니다.

---

## 📢 공지사항

홈페이지 공지는 다음 카테고리로 구분됩니다.

| 분류 | 내용 |
| --- | --- |
| 📢 공지 | PEPE RESTAURANT 공식 안내 |
| 🛠️ 업데이트 | 홈페이지·봇·운영 시스템 업데이트 |
| ⛏️ Minecraft | Minecraft 서버 관련 소식 |

공지사항이 많아질 경우 기본적으로 최근 항목만 표시하며 **더보기 / 숨기기** 기능으로 전체 내용을 확인할 수 있습니다.

새로운 홈페이지 공지는 PEPE MANAGER가 감지하여 Discord 공지 채널에도 카테고리에 맞는 Embed 형식으로 자동 게시합니다.

---

## 🔐 승인 및 인증 시스템

PEPE RESTAURANT는 Minecraft 서버 주소와 Discord 초대 링크를 공개적으로 제공하지 않습니다.

### Minecraft

Minecraft 인증 역할을 가진 사용자 또는 승인된 사용자는 Discord 인증 후 서버 접속 정보를 확인할 수 있습니다.

### Discord 초대

Discord 초대 링크가 필요한 사용자는 홈페이지에서 초대 요청을 제출할 수 있습니다.

1. Discord 계정으로 요청
2. 운영진 검토
3. 승인 또는 거절
4. 승인된 사용자에게만 초대 링크 제공

승인 정보는 브라우저 인증 정보로 일정 시간 유지될 수 있습니다.

---

## ❓ FAQ

홈페이지에는 가입과 서버 이용 과정에서 자주 묻는 질문을 정리한 FAQ가 포함되어 있습니다.

- Discord 초대 링크 요청 방법
- Minecraft 서버 주소 확인 방법
- 승인 후 재인증 여부
- Java / Bedrock Crossplay
- Minecraft 인증 역할
- 인증 및 초대 요청 거절
- PEPE MANAGER / 꼬붕봇
- 문의 · 신고 · 티켓
- 홈페이지 ↔ Discord 공지 연동

FAQ 역시 **더보기 / 숨기기** 방식으로 구성되어 있습니다.

---

## 🏗️ 시스템 구조

```text
GitHub Pages
     │
     │ HTTPS
     ▼
PEPE RESTAURANT Website
     │
     ▼
api.pepe.ice.fo
     │
     ▼
PEPE MANAGER
     ├── Discord
     ├── Minecraft
     ├── 인증 시스템
     ├── 초대 승인 시스템
     ├── 공지 자동 연동
     └── 관리자 시스템
```

공개 GitHub Pages에는 민감한 서버 접속 정보나 인증 비밀값을 저장하지 않고, 권한 확인이 필요한 데이터는 PEPE MANAGER API를 통해 처리합니다.

---

## 📁 프로젝트 구성

```text
website/
├── index.html
├── style.css
├── script.js
├── config.js
├── announcements.json
├── request.html
├── request.js
├── approval.html
├── approval.js
├── service-worker.js
├── manifest.webmanifest
└── assets/
```

실제 파일 구성은 버전에 따라 일부 달라질 수 있습니다.

---

## 🚀 배포

홈페이지는 GitHub Pages를 사용합니다.

일반적인 프론트엔드 업데이트는 `website/` 내용을 GitHub Pages 저장소에 반영하면 됩니다.

배포 후 이전 파일이 캐시에 남아 있다면 브라우저에서 강력 새로고침을 실행합니다.

```text
Windows: Ctrl + F5
```

PEPE MANAGER API 또는 Discord 연동 코드가 변경되는 버전은 별도로 VPS의 백엔드 파일을 업데이트해야 합니다.

---

## 🔒 Security

다음 정보는 공개 GitHub 저장소에 직접 저장하지 않는 것을 원칙으로 합니다.

- Minecraft 실제 접속 주소
- 비공개 Discord 초대 링크
- Discord Bot Token
- Discord Client Secret
- API 인증 Secret
- 관리자 인증 정보
- `.env` 파일

민감한 설정은 서버 환경 변수에서 관리하며, 공개 웹사이트에는 필요한 공개 설정만 포함합니다.

---

## 🧪 Current Website Version

**PEPE RESTAURANT Website 1.5.0**

### 1.5.0 · PEPE LIVE

- Minecraft 상세 정보를 메인 홈페이지에서 `minecraft.html` 전용 페이지로 분리
- 메인에는 Minecraft 전용 페이지 진입 쇼케이스만 유지
- Minecraft LIVE STATUS 대시보드 추가
- WHO'S ONLINE 플레이어 영역 추가
- SERVER STATS 공개 통계 영역 추가
- PEPE RANKING 탭 UI 추가
- 기존 접속 인증, Crossplay 안내, PEPE ORIGINAL PLUGINS 전체 이전
- PEPE LIVE 실시간 연동 완료: 접속자/플랫폼/통계/랭킹 데이터를 `/api/public/status`에서 직접 표시
- 서비스워커 캐시 키를 `1.5.0-final`로 갱신하고 `minecraft.html` 캐시 포함

---

**PEPE RESTAURANT Website 1.4.2**

### 1.4.2

- Minecraft 소개 영역에 **PEPE ORIGINAL PLUGINS** 쇼케이스 추가
- 자체 제작 플러그인 8종 `IN-HOUSE` 카드 추가
- 각 플러그인 카드 클릭 시 실제 JAR 기능 기준 상세 팝업 표시
- 모바일/태블릿 반응형 카드 레이아웃 적용
- 정적 자산 캐시 버전 1.4.2로 갱신


주요 업데이트:

- Minecraft 상세 소개 팝업
- Java + Bedrock Crossplay 안내
- Minecraft 서버 버전 실시간 연동
- 공지사항 더보기 / 숨기기
- FAQ 최신화 및 더보기 / 숨기기
- 공지 / 업데이트 / Minecraft 카테고리
- 홈페이지 → Discord 공지 자동 연동
- 홈페이지 홍보 Embed
- 승인 사용자 인증 유지
- Discord 초대 요청 및 관리자 승인 시스템

---

## 🐸 PEPE SYSTEMS

**PEPE RESTAURANT · 우리 서버를 위해 직접 만듭니다.**

PEPE MANAGER와 홈페이지를 포함한 운영 시스템은 PEPE RESTAURANT 환경에 맞춰 직접 설계하고 지속적으로 개선합니다.


## 1.5.0 Stable + LIVE integration baseline

- Base: PEPE RESTAURANT 1.4.2 JAR VERIFIED stable frontend.
- Minecraft details are separated into `minecraft.html`.
- PEPE ORIGINAL PLUGINS card/modal text is based on analysis of the 8 uploaded JARs.
- Minecraft version/status uses only `GET /api/public/status` (`minecraft.version`); `/api/server-status` is not used.
- Protected Minecraft addresses and private Discord invite links remain behind API authorization and are not embedded in GitHub Pages.
- LIVE flow: PepeBridge 1.1.1 -> Minecraft Agent (LIVE 1.5.0 patch) -> PEPE MANAGER 5.2 -> `/api/public/status` -> `minecraft.html`.
- Public Minecraft LIVE fields in active use: `players`, `playerPlatforms`, `stats`, `rankings`, `uptimeSeconds`, `tps`, `version`.
- The historical `JAR-ANALYSIS-1.4.2.md` records the originally uploaded PepeBridge 1.0.0 JAR; production now runs PepeBridge 1.1.1 for PEPE LIVE.
