/* =========================================================
   확원 - study.js (학습 페이지)
   ========================================================= */

let studyCourse = null;

function renderStudyHead() {
  const head = document.getElementById("study-head");
  const percent = getCourseProgress(studyCourse.id);
  head.innerHTML = `
    <div class="wrap">
      <a class="back-link" href="courses.html">← 과정 선택으로</a>
      <h1>${escapeHTML(studyCourse.title)}</h1>
      <p class="study-desc">${escapeHTML(studyCourse.desc)}</p>
      <div class="study-progress">
        <p class="label">학습 진행률</p>
        ${progressBarHTML(percent, { label: studyCourse.title + " 진행률" })}
      </div>
    </div>
  `;
  animateProgressBars(head);
}

function conceptHTML(c) {
  const block = (title, inner) =>
    `<div class="concept-block"><h4>${title}</h4>${inner}</div>`;

  let html = "";
  html += block("핵심 개념", `<ul>${c.keys.map((k) => `<li>${escapeHTML(k)}</li>`).join("")}</ul>`);
  html += block("공식", c.formulas.map((f) => `<p class="formula">${escapeHTML(f)}</p>`).join(""));
  html += block("개념 설명", `<p style="color:var(--gray-700)">${escapeHTML(c.explain)}</p>`);
  html += block(
    "예제",
    c.examples
      .map(
        (e) =>
          `<div class="example"><p class="ex-q">Q. ${escapeHTML(e.q)}</p><p class="ex-a">A. ${escapeHTML(e.a)}</p></div>`
      )
      .join("")
  );
  html += block(
    "주의할 점",
    `<ul class="caution">${c.cautions.map((t) => `<li>${escapeHTML(t)}</li>`).join("")}</ul>`
  );
  return html;
}

function lessonStatusText(rec, lesson) {
  const conceptDone = !!rec.concepts[lesson.id];
  const quiz = rec.quiz[lesson.id];
  if (conceptDone && quiz) return { text: `완료 · ${quiz.correct}/${quiz.total}`, done: true };
  if (quiz) return { text: `문제 ${quiz.correct}/${quiz.total}`, done: false };
  if (conceptDone) return { text: "개념 학습 완료", done: false };
  return { text: "학습 전", done: false };
}

function renderLessons() {
  const mount = document.getElementById("lesson-list");
  const lessons = LESSONS[studyCourse.id] || [];
  const rec = getCourseRecord(studyCourse.id);

  mount.innerHTML = lessons
    .map((ls, i) => {
      const st = lessonStatusText(rec, ls);
      const conceptDone = !!rec.concepts[ls.id];
      return `
      <article class="lesson${i === 0 ? " is-open" : ""}" data-lesson="${ls.id}">
        <button class="lesson-header" type="button" aria-expanded="${i === 0}">
          <span class="lesson-index">${i + 1}</span>
          <span class="lesson-title">${escapeHTML(ls.title)}</span>
          <span class="lesson-status${st.done ? " done" : ""}">${st.text}</span>
          <span class="lesson-caret" aria-hidden="true">▼</span>
        </button>
        <div class="lesson-body">
          ${conceptHTML(ls.concept)}
          <div class="lesson-actions">
            <button class="btn ${conceptDone ? "btn-quiet" : "btn-ghost"} js-concept" type="button" data-lesson="${ls.id}">
              ${conceptDone ? "개념 학습 완료됨" : "개념 학습 완료로 표시"}
            </button>
            <a class="btn btn-primary" href="quiz.html?course=${studyCourse.id}&lesson=${ls.id}">
              문제 풀기 (${ls.questions.length}문제)
            </a>
          </div>
        </div>
      </article>`;
    })
    .join("");

  // 아코디언 열고 닫기
  mount.querySelectorAll(".lesson-header").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lesson = btn.closest(".lesson");
      const open = lesson.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  // 개념 학습 완료 토글
  mount.querySelectorAll(".js-concept").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lessonId = btn.dataset.lesson;
      const current = !!getCourseRecord(studyCourse.id).concepts[lessonId];
      setConceptDone(studyCourse.id, lessonId, !current);
      refresh();
    });
  });
}

function refresh() {
  const openIds = Array.from(document.querySelectorAll(".lesson.is-open")).map(
    (el) => el.dataset.lesson
  );
  renderStudyHead();
  renderLessons();
  document.querySelectorAll(".lesson").forEach((el) => {
    const shouldOpen = openIds.includes(el.dataset.lesson);
    el.classList.toggle("is-open", shouldOpen);
    el.querySelector(".lesson-header").setAttribute("aria-expanded", String(shouldOpen));
  });
}

function renderNotFound() {
  document.getElementById("study-head").innerHTML = `
    <div class="wrap"><h1>과정을 찾을 수 없습니다</h1>
    <p class="study-desc">주소가 잘못되었거나 아직 열리지 않은 과정입니다.</p></div>`;
  document.getElementById("lesson-list").innerHTML = `
    <div class="empty">
      <h3>과정 목록에서 다시 골라 주세요</h3>
      <p>확원에는 중1-1 기초·응용·심화, 중2-1 기초·응용 다섯 개 과정이 있습니다.</p>
      <a class="btn btn-primary" href="courses.html">과정 선택으로</a>
    </div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  studyCourse = getCourse(getParam("course"));
  if (!studyCourse || !LESSONS[studyCourse.id]) {
    renderNotFound();
    return;
  }
  document.title = `${studyCourse.title} · 확원`;
  renderStudyHead();
  renderLessons();
});
