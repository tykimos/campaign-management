# Campaign Management System - 설치 가이드

> **버전**: 1.0.0  
> **최종 업데이트**: 2024-12-03  

## 📋 목차

1. [필요한 계정 생성](#1-필요한-계정-생성)
2. [개발 환경 설정](#2-개발-환경-설정) 
3. [프로젝트 설치](#3-프로젝트-설치)
4. [Supabase 설정](#4-supabase-설정)
5. [환경 변수 설정](#5-환경-변수-설정)
6. [로컬 테스트](#6-로컬-테스트)
7. [Vercel 배포](#7-vercel-배포)
8. [사용 방법](#8-사용-방법)

---

## 1. 필요한 계정 생성

### 1.1 Supabase 계정
1. [supabase.com](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인

### 1.2 Vercel 계정 (선택사항)
1. [vercel.com](https://vercel.com) 접속
2. "Sign Up" 클릭
3. GitHub 계정으로 로그인

---

## 2. 개발 환경 설정

### 2.1 Node.js 설치
- [nodejs.org](https://nodejs.org)에서 LTS 버전 다운로드 및 설치
- 버전 확인: `node --version` (v18 이상 권장)

### 2.2 Git 설치
- [git-scm.com](https://git-scm.com)에서 다운로드 및 설치

---

## 3. 프로젝트 설치

```bash
# 프로젝트 클론
git clone [repository-url]
cd campaign-management

# 의존성 설치
npm install
```

---

## 4. Supabase 설정

### 4.1 새 프로젝트 생성
1. [app.supabase.com](https://app.supabase.com) 접속
2. "New Project" 클릭
3. 설정:
   - Project name: `campaign-management`
   - Database Password: 강력한 비밀번호 생성
   - Region: 가장 가까운 지역 선택

### 4.2 데이터베이스 설정
1. 왼쪽 메뉴에서 "SQL Editor" 클릭
2. "New query" 클릭
3. `database.sql` 파일의 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭

### 4.3 API 키 확인
1. "Settings" → "API" 클릭
2. 다음 값들을 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbG...`

---

## 5. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 6. 로컬 테스트

### 6.1 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

### 6.2 테스트 계정
1. 회원가입: 우측 상단 "회원가입" 클릭
2. 이메일과 비밀번호로 가입

---

## 7. Vercel 배포

### 7.1 Vercel CLI 설치 (선택사항)
```bash
npm i -g vercel
```

### 7.2 배포
```bash
vercel
```

또는 Vercel 대시보드에서:
1. "Import Project" 클릭
2. GitHub 저장소 연결
3. 환경 변수 설정
4. "Deploy" 클릭

---

## 8. 사용 방법

### 8.1 채널 관리
1. **채널 추가**: "채널 관리" → "채널 추가" 버튼
2. **정보 입력**: 
   - 채널명 (필수)
   - 카테고리 선택 (공모전/커뮤니티/SNS/이벤트)
   - URL
   - 회원수, 일평균 조회수
3. **저장**: "추가" 버튼 클릭

### 8.2 캠페인 생성
1. **캠페인 추가**: "캠페인 관리" → "캠페인 추가"
2. **정보 입력**:
   - 캠페인명 (필수)
   - 기간 설정
   - 목표 조회수/등록수
   - 예산 (선택)
3. **저장**: "추가" 버튼 클릭

### 8.3 게재 기록
1. **게재 추가**: "게재 현황" → "게재 추가"
2. **정보 입력**:
   - 캠페인 선택
   - 채널 선택
   - 게재 URL (필수)
   - 게재일
3. **성과 업데이트**: 
   - 조회수, 클릭수, 등록수 입력
   - 자동으로 전환율 계산

### 8.4 성과 분석
1. **대시보드**: 전체 성과 요약 확인
2. **성과 분석**: 
   - 기간별 필터링
   - 캠페인별 필터링
   - 차트 및 그래프 확인

### 8.5 데이터 관리
1. **내보내기**: "설정" → "데이터 내보내기"
2. **JSON 형식**으로 전체 데이터 다운로드

---

## 📱 주요 기능

### 대시보드
- 총 조회수, 등록수, 진행중 캠페인 확인
- 일별 성과 트렌드
- 채널별 성과 비교

### 캠페인 관리
- 캠페인 상태 관리 (계획중/진행중/완료/취소)
- 목표 대비 달성률 확인
- 예산 관리

### 채널 관리
- 40+ 사전 등록된 채널
- 카테고리별 분류
- 채널 정보 수정/삭제

### 게재 현황
- 실시간 성과 추적
- 전환율 자동 계산
- 상태 관리

### 성과 분석
- 다양한 차트 제공
- 기간별 분석
- 상위 성과 게시물

---

## 🔧 문제 해결

### "Missing Supabase environment variables" 오류
- `.env` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 값이 올바른지 확인

### 로그인이 안 되는 경우
- Supabase Dashboard → Authentication → Users 확인
- 이메일 인증 설정 확인

### 데이터가 표시되지 않는 경우
- 브라우저 개발자 도구에서 네트워크 오류 확인
- Supabase RLS 정책 확인

---

## 📚 추가 리소스

- [Supabase 문서](https://supabase.com/docs)
- [React 문서](https://react.dev)
- [Vite 문서](https://vitejs.dev)
- [TailwindCSS 문서](https://tailwindcss.com)

---

## 🤝 지원

문제가 있으시면 이슈를 생성하거나 다음으로 연락주세요:
- GitHub Issues: [repository-issues-url]
- Email: support@example.com