/* =========================================================
   확원 - main.js (홈 페이지)
   ========================================================= */

function pickResumeCourse() {
  // 진행 중(0% 초과 100% 미만)인 과정을 우선, 없으면 첫 과정
  let inProgress = null;
  for (const c of COURSES) {
    const p = getCourseProgress(c.id);
    if (p > 0 && p < 100) {
      if (!inProgress || p > inProgress.percent) inProgress = { course: c, percent: p };
    }
  }
  if (inProgress) return inProgress;
  const done = COURSES.find((c) => getCourseProgress(c.id) === 100);
  if (done) return { course: done, percent: 100 };
  return { course: COURSES[0], percent: 0 };
}

function renderHeroCard() {
  const mount = document.getElementById("hero-card");
  if (!mount) return;

  const { course, percent } = pickResumeCourse();
  const started = percent > 0;

  mount.innerHTML = `
    <h3>${started ? "이어서 공부하기" : "여기부터 시작해요"}</h3>
    <p class="hero-course">${escapeHTML(course.title)}</p>
    ${progressBarHTML(percent, { label: course.title + " 진행률" })}
    <a class="btn btn-primary btn-block" style="margin-top:18px" href="study.html?course=${course.id}">
      ${started ? "이어서 학습하기" : "학습 시작"}
    </a>
    <ul class="hero-steps">
      <li><span class="step-num">1</span> 과정 고르기</li>
      <li><span class="step-num">2</span> 개념 학습</li>
      <li><span class="step-num">3</span> 문제 풀이와 채점</li>
      <li><span class="step-num">4</span> 학습 기록 확인</li>
    </ul>
  `;
  animateProgressBars(mount);
}

function renderHomeCourses() {
  const mount = document.getElementById("home-courses");
  if (!mount) return;

  mount.innerHTML = COURSES.map((c) => {
    const percent = getCourseProgress(c.id);
    const count = (LESSONS[c.id] || []).length;
    return `
      <article class="course-card">
        <span class="course-tag" data-level="${c.level}">${c.level}</span>
        <h3>${escapeHTML(c.title)}</h3>
        <p class="course-desc">${escapeHTML(c.desc)}</p>
        ${progressBarHTML(percent, { small: true, label: c.title + " 진행률" })}
        <p class="course-meta">단원 ${count}개 · 문제 ${countQuestions(c.id)}개</p>
        <a class="btn btn-ghost btn-block" href="study.html?course=${c.id}">학습 시작</a>
      </article>
    `;
  }).join("");

  animateProgressBars(mount);
}

function countQuestions(courseId) {
  return (LESSONS[courseId] || []).reduce((sum, l) => sum + l.questions.length, 0);
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeroCard();
  renderHomeCourses();
});
