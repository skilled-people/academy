/* =========================================================
   확원 - courses.js (과정 선택 페이지)
   ========================================================= */

function renderCourseGrid() {
  const mount = document.getElementById("course-grid");
  if (!mount) return;

  mount.innerHTML = COURSES.map((c) => {
    const lessons = LESSONS[c.id] || [];
    const questions = lessons.reduce((s, l) => s + l.questions.length, 0);
    const percent = getCourseProgress(c.id);
    const acc = getCourseAccuracy(c.id);
    const meta =
      acc.total > 0
        ? `단원 ${lessons.length}개 · 문제 ${questions}개 · 정답률 ${acc.rate}%`
        : `단원 ${lessons.length}개 · 문제 ${questions}개`;

    return `
      <article class="course-card">
        <span class="course-tag" data-level="${c.level}">${c.grade} · ${c.level}</span>
        <h3>${escapeHTML(c.title)}</h3>
        <p class="course-desc">${escapeHTML(c.desc)}</p>
        ${progressBarHTML(percent, { small: true, label: c.title + " 진행률" })}
        <p class="course-meta">${meta}</p>
        <a class="btn btn-primary btn-block" href="study.html?course=${c.id}">
          ${percent > 0 && percent < 100 ? "이어서 학습" : percent === 100 ? "다시 학습" : "학습 시작"}
        </a>
      </article>
    `;
  }).join("");

  animateProgressBars(mount);
}

document.addEventListener("DOMContentLoaded", renderCourseGrid);
