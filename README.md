# plz-noti-server

내가 마음대로 조직하는 내 디바이스 알림

- 옷 입기 전에 지금 날씨를 알고 싶어
- 출근하기 직전에 내가 타는 버스 도착 정보를 알고 싶어
- 점심 시간에 오늘 인기인 소셜 미디어 인기글 정보를 보고 싶어

시간 기반 + 외부 데이터 소스 알림을 쉽게 받아보기 위한 사이드 프로젝트

## Prepare Environment

### 1. 환경 변수 설정

```sh
cp .env.example .env
nvim .env
```

### 2. Firebase 서비스 어카운트 파일

```sh
ls google-service-account.json
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
