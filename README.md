# 확원 (π 확원)

> 원하는 공부를, 확실하게.

중학교 수학을 수준별로 골라 개념을 익히고 문제를 푸는 학습 웹앱입니다.
서버·회원가입 없이 브라우저 localStorage에 학습 기록이 저장됩니다.

## 실행 방법

`index.html` 을 브라우저로 열면 바로 동작합니다. (별도 설치·빌드 없음)

## GitHub Pages에 올릴 때 주의

**폴더째로 올려야 합니다.** `index.html` 하나만 올리면 `css/style.css` 와 `js/*.js` 를
찾지 못해서 글꼴·색·네비게이션이 전부 사라진 맨 HTML로 보입니다.

저장소에 이 구조 그대로 올라가 있어야 합니다.

```
index.html
courses.html
study.html
quiz.html
progress.html
css/style.css
js/data.js  js/common.js  js/main.js  js/courses.js  js/study.js  js/quiz.js  js/progress.js
```

폴더를 올리기 번거로우면 함께 드린 **단일 파일 index.html** 을 쓰세요.
CSS와 JS가 전부 안에 들어 있어서 그 파일 하나만 올리면 똑같이 동작합니다.

## 파일 구조

```
index.html      홈
courses.html    과정 선택 (5개 과정)
study.html      학습 페이지  ?course=과정id
quiz.html       문제 풀이    ?course=과정id&lesson=단원id
progress.html   학습 기록

css/style.css   전체 스타일 (디자인 토큰 · 반응형)

js/data.js      과정 · 개념 · 문제 데이터  ← 콘텐츠는 여기만 수정
js/common.js    localStorage, 진행률 계산, 네비게이션 (모든 페이지 공통)
js/main.js      홈
js/courses.js   과정 선택
js/study.js     학습
js/quiz.js      문제 풀이 · 채점
js/progress.js  학습 기록

assets/logo/, assets/icons/
```

## 과정 (5개)

| id | 과정 |
| --- | --- |
| `m1-basic` | 중1-1 기초 |
| `m1-applied` | 중1-1 응용 |
| `m1-advanced` | 중1-1 심화 |
| `m2-basic` | 중2-1 기초 |
| `m2-applied` | 중2-1 응용 |

## 문제 추가하기

`js/data.js` 의 `LESSONS` 에서 해당 과정의 `questions` 배열에 객체를 추가하면 끝입니다.
문제 수, 진행률, 결과 화면은 모두 자동으로 다시 계산됩니다.

```js
// 객관식
{ type: "choice", q: "...", choices: ["...", "..."], answer: 0, explanation: "..." }

// 단답형 (허용할 표기를 여러 개 쓸 수 있습니다)
{ type: "short", q: "...", answer: ["12", "12개"], explanation: "..." }

// 서술형 (모범 답안을 보여 주고 학생이 스스로 채점)
{ type: "essay", q: "...", model: "...", explanation: "채점 기준" }
```

단원을 추가하려면 같은 파일에서 `{ id, title, concept, questions }` 객체를 배열에 넣으면 됩니다.

## 진행률 계산

단원마다 `개념 학습 완료` 1칸 + `문제 풀이 완료` 1칸으로 계산합니다.
3단원 과정이면 총 6칸이므로 개념 하나를 읽으면 17%가 올라갑니다.
