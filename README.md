# Campaign Management System

캠페인 게재 현황과 성과를 통합 관리하는 시스템

## 🚀 주요 기능

- **📊 대시보드**: 전체 캠페인 성과를 한눈에 확인
- **📣 캠페인 관리**: 캠페인 생성, 일정 및 목표 설정
- **📡 채널 관리**: 40+ 사전 등록된 채널 (공모전, 커뮤니티, SNS)
- **📝 게재 추적**: 채널별 게재 현황 및 URL 관리
- **📈 성과 분석**: 조회수, 클릭수, 등록수, 전환율 추적

## 🛠 기술 스택

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Charts**: Recharts
- **Deployment**: Vercel

## 📦 설치 방법

```bash
# 저장소 클론
git clone [repository-url]
cd campaign-management

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 Supabase 정보 입력

# 개발 서버 실행
npm run dev
```

## 📚 문서

- [설치 가이드](./guide.md) - 상세 설치 및 설정 방법
- [PRD](./prd.md) - 제품 요구사항 문서
- [데이터베이스 스키마](./database.sql) - 테이블 구조

## 🖼 스크린샷

### 대시보드
- 전체 성과 요약 카드
- 일별 트렌드 차트
- 캠페인 상태 분포

### 채널 관리
- 카테고리별 필터링
- 채널 정보 카드
- 활성/비활성 관리

### 게재 현황
- 실시간 성과 추적
- 전환율 자동 계산
- 필터 및 검색

## 📝 라이센스

MIT License

## 🤝 기여

Issues와 Pull Requests를 환영합니다!

## 📧 문의

문제가 있으시면 이슈를 생성해주세요.