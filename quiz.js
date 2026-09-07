/* =========================================================
   확원 - quiz.js (문제 풀이 페이지)
   ========================================================= */

const TYPE_LABEL = { choice: "객관식", short: "단답형", essay: "서술형" };

const quiz = {
  course: null,
  lesson: null,
  questions: [],
  index: 0,
  picked: null,      // 객관식에서 고른 번호
  checked: false,    // 채점 여부
  results: [],       // { correct, given }
};

const shell = () => document.getElementById("quiz-shell");

/* ---------- 정답 판정 ---------- */

function normalize(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[·,]/g, "")
    .replace(/개$|자리$|마리$/g, "")
    .replace(/^x=/, "")
    .replace(/^a=/, "");
}

function isShortCorrect(question, given) {
  const g = normalize(given);
  if (!g) return false;
  return question.answer.some((a) => normalize(a) === g);
}

/* ---------- 화면: 과정/단원 선택 ---------- */

function renderPicker(message) {
  const rows = COURSES.map((c) => {
    const lessons = LESSONS[c.id] || [];
    const rec = getCourseRecord(c.id);
    const items = lessons
      .map((l) => {
        const q = rec.quiz[l.id];
        const meta = q ? `최고 ${q.correct}/${q.total}` : `${l.questions.length}문제`;
        return `<a class="btn btn-quiet" style="justify-content:space-between;width:100%;margin-bottom:8px"
                   href="quiz.html?course=${c.id}&lesson=${l.id}">
                  <span>${escapeHTML(l.title)}</span><span style="font-weight:600;color:var(--gray-500)">${meta}</span>
                </a>`;
      })
      .join("");
    return `
      <div class="quiz-card" style="margin-bottom:18px">
        <p class="quiz-course">${escapeHTML(c.title)}</p>
        <h2 style="font-size:20px;margin:2px 0 16px">${escapeHTML(c.desc)}</h2>
        ${items}
      </div>`;
  }).join("");

  shell().innerHTML = `
    ${message ? `<div class="empty" style="margin-bottom:20px"><h3>${escapeHTML(message)}</h3><p>아래에서 단원을 골라 주세요.</p></div>` : ""}
    <h1 style="font-size:26px;margin-bottom:6px">문제 풀기</h1>
    <p style="color:var(--gray-500);margin-bottom:24px">단원을 고르면 바로 문제가 시작됩니다.</p>
    ${rows}
  `;
}

/* ---------- 화면: 문제 ---------- */

function renderQuestion() {
  const q = quiz.questions[quiz.index];
  const total = quiz.questions.length;

  let inputHTML = "";
  if (q.type === "choice") {
    inputHTML = `
      <div class="choices" id="choices">
        ${q.choices
          .map(
            (ch, i) =>
              `<button class="choice" type="button" data-i="${i}">
                 <span class="num">${i + 1}</span><span>${escapeHTML(ch)}</span>
               </button>`
          )
          .join("")}
      </div>`;
  } else if (q.type === "short") {
    inputHTML = `
      <input class="answer-input" id="short-input" type="text" inputmode="text"
             placeholder="정답을 입력하세요" autocomplete="off" />
      <p class="input-hint">숫자만 쓰거나 분수는 7/9 처럼 입력하세요.</p>`;
  } else {
    inputHTML = `
      <textarea class="answer-input" id="essay-input"
                placeholder="풀이 과정을 순서대로 적어 보세요."></textarea>
      <p class="input-hint">제출하면 모범 답안이 나옵니다. 내 답과 비교해서 직접 채점합니다.</p>`;
  }

  shell().innerHTML = `
    <div class="quiz-topbar">
      <span class="quiz-course">${escapeHTML(quiz.course.title)} · ${escapeHTML(quiz.lesson.title)}</span>
      <span class="quiz-count">${quiz.index + 1} / ${total}</span>
    </div>
    ${progressBarHTML(((quiz.index) / total) * 100, { small: true, hideValue: true, label: "문제 진행" })}
    <div class="quiz-card" style="margin-top:16px">
      <span class="q-type">${TYPE_LABEL[q.type]}</span>
      <p class="q-number">문제 ${quiz.index + 1}</p>
      <h2 class="q-text">${escapeHTML(q.q)}</h2>
      ${inputHTML}
      <div class="quiz-actions">
        <button class="btn btn-primary" id="submit-btn" type="button">정답 제출</button>
        <a class="btn btn-quiet" href="study.html?course=${quiz.course.id}">개념 다시 보기</a>
      </div>
      <div id="feedback"></div>
    </div>
  `;

  animateProgressBars(shell());

  if (q.type === "choice") {
    shell().querySelectorAll(".choice").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (quiz.checked) return;
        quiz.picked = Number(btn.dataset.i);
        shell()
          .querySelectorAll(".choice")
          .forEach((b) => b.classList.toggle("is-picked", b === btn));
      });
    });
  }

  if (q.type === "short") {
    const input = document.getElementById("short-input");
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById("submit-btn").click();
      }
    });
    input.focus();
  }

  document.getElementById("submit-btn").addEventListener("click", submitAnswer);
}

/* ---------- 채점 ---------- */

function submitAnswer() {
  if (quiz.checked) return;
  const q = quiz.questions[quiz.index];
  const fb = document.getElementById("feedback");

  if (q.type === "choice") {
    if (quiz.picked === null) {
      fb.innerHTML = `<div class="feedback no"><p class="verdict">보기를 하나 고르세요</p></div>`;
      return;
    }
    const correct = quiz.picked === q.answer;
    lockChoices(q, correct);
    finishQuestion(correct, q.choices[quiz.picked], `${q.answer + 1}번 · ${q.choices[q.answer]}`, q.explanation);
    return;
  }

  if (q.type === "short") {
    const input = document.getElementById("short-input");
    const given = input.value;
    if (!given.trim()) {
      fb.innerHTML = `<div class="feedback no"><p class="verdict">답을 입력한 뒤 제출하세요</p></div>`;
      input.focus();
      return;
    }
    const correct = isShortCorrect(q, given);
    input.disabled = true;
    finishQuestion(correct, given.trim(), q.answer[0], q.explanation);
    return;
  }

  // 서술형: 모범 답안을 보여 주고 학생이 스스로 채점
  const input = document.getElementById("essay-input");
  const given = input.value;
  if (!given.trim()) {
    fb.innerHTML = `<div class="feedback no"><p class="verdict">풀이를 적은 뒤 제출하세요</p></div>`;
    input.focus();
    return;
  }
  input.disabled = true;
  quiz.checked = true;
  document.getElementById("submit-btn").disabled = true;

  fb.innerHTML = `
    <div class="feedback ok" style="background:var(--blue-50);border-color:var(--blue-100)">
      <p class="verdict" style="color:var(--blue-700)">모범 답안</p>
      <p class="explain">${escapeHTML(q.model)}</p>
      <p class="explain" style="margin-top:10px"><strong>채점 기준</strong> ${escapeHTML(q.explanation)}</p>
      <div class="self-check">
        <button class="btn btn-primary js-self" type="button" data-ok="1">내 풀이가 맞았어요</button>
        <button class="btn btn-quiet js-self" type="button" data-ok="0">틀렸어요</button>
      </div>
    </div>`;

  fb.querySelectorAll(".js-self").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ok = btn.dataset.ok === "1";
      quiz.results[quiz.index] = { correct: ok, given: given.trim() };
      fb.querySelector(".self-check").remove();
      fb.insertAdjacentHTML(
        "beforeend",
        `<p class="verdict" style="margin-top:12px;color:${ok ? "var(--ok)" : "var(--no)"}">${ok ? "맞은 문제로 기록했습니다" : "틀린 문제로 기록했습니다"}</p>`
      );
      showNextButton();
    });
  });
}

function lockChoices(q, correct) {
  shell().querySelectorAll(".choice").forEach((btn, i) => {
    btn.disabled = true;
    btn.classList.remove("is-picked");
    if (i === q.answer) btn.classList.add("is-correct");
    else if (i === quiz.picked && !correct) btn.classList.add("is-wrong");
  });
}

function finishQuestion(correct, given, answerText, explanation) {
  quiz.checked = true;
  quiz.results[quiz.index] = { correct, given };
  document.getElementById("submit-btn").disabled = true;

  document.getElementById("feedback").innerHTML = `
    <div class="feedback ${correct ? "ok" : "no"}">
      <p class="verdict">${correct ? "정답입니다" : "오답입니다"}</p>
      <p class="answer-line">정답 · ${escapeHTML(answerText)}</p>
      <p class="explain">${escapeHTML(explanation)}</p>
    </div>`;

  showNextButton();
}

function showNextButton() {
  const actions = shell().querySelector(".quiz-actions");
  if (actions.querySelector(".js-next")) return;
  const last = quiz.index === quiz.questions.length - 1;
  actions.insertAdjacentHTML(
    "afterbegin",
    `<button class="btn btn-primary js-next" type="button">${last ? "결과 보기" : "다음 문제"}</button>`
  );
  const next = actions.querySelector(".js-next");
  next.addEventListener("click", () => {
    if (last) {
      renderResult();
    } else {
      quiz.index += 1;
      quiz.picked = null;
      quiz.checked = false;
      renderQuestion();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  next.focus();
}

/* ---------- 결과 ---------- */

function renderResult() {
  const total = quiz.questions.length;
  const correct = quiz.results.filter((r) => r && r.correct).length;
  const wrong = total - correct;
  const rate = Math.round((correct / total) * 100);

  saveQuizResult(quiz.course.id, quiz.lesson.id, correct, total);

  const lessons = LESSONS[quiz.course.id];
  const pos = lessons.findIndex((l) => l.id === quiz.lesson.id);
  const nextLesson = lessons[pos + 1] || null;

  const review = quiz.questions
    .map((q, i) => {
      const r = quiz.results[i] || { correct: false, given: "-" };
      const answerText =
        q.type === "choice" ? `${q.answer + 1}번 · ${q.choices[q.answer]}` : q.type === "short" ? q.answer[0] : "모범 답안 참고";
      return `
        <div class="review-item ${r.correct ? "ok" : "no"}">
          <p class="rq">${i + 1}. ${escapeHTML(q.q)}</p>
          <p class="ra">내 답 ${escapeHTML(String(r.given))} · 정답 ${escapeHTML(answerText)}</p>
        </div>`;
    })
    .join("");

  shell().innerHTML = `
    <div class="result-card appear">
      <p class="quiz-course">${escapeHTML(quiz.course.title)} · ${escapeHTML(quiz.lesson.title)}</p>
      <p class="result-score">${rate}점</p>
      <p class="result-label">${total}문제 중 ${correct}문제를 맞혔습니다</p>
      <div class="result-stats">
        <div class="result-stat"><p class="num" style="color:var(--ok)">${correct}</p><p class="cap">맞힌 문제</p></div>
        <div class="result-stat"><p class="num" style="color:var(--no)">${wrong}</p><p class="cap">틀린 문제</p></div>
        <div class="result-stat"><p class="num">${rate}%</p><p class="cap">정답률</p></div>
      </div>
      <div class="result-actions">
        ${nextLesson
          ? `<a class="btn btn-primary" href="quiz.html?course=${quiz.course.id}&lesson=${nextLesson.id}">다음 단원 문제 풀기</a>`
          : `<a class="btn btn-primary" href="courses.html">다른 과정 고르기</a>`}
        <button class="btn btn-ghost" id="retry-btn" type="button">다시 풀기</button>
        <a class="btn btn-quiet" href="progress.html">학습 기록 보기</a>
      </div>
      <div class="review">
        <h3>문제별 결과</h3>
        ${review}
      </div>
    </div>`;

  document.getElementById("retry-btn").addEventListener("click", () => {
    quiz.index = 0;
    quiz.picked = null;
    quiz.checked = false;
    quiz.results = [];
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- 시작 ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const courseId = getParam("course");
  const lessonId = getParam("lesson");

  if (!courseId && !lessonId) {
    renderPicker(null);
    return;
  }

  const course = getCourse(courseId);
  const lesson = course ? getLesson(courseId, lessonId) : null;

  if (!course || !lesson || !lesson.questions.length) {
    renderPicker("요청한 문제를 찾을 수 없습니다");
    return;
  }

  quiz.course = course;
  quiz.lesson = lesson;
  quiz.questions = lesson.questions;
  quiz.index = 0;
  quiz.picked = null;
  quiz.checked = false;
  quiz.results = new Array(lesson.questions.length).fill(null);
  document.title = `${lesson.title} 문제 · 확원`;
  renderQuestion();
});
