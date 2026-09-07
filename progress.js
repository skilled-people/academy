/* =========================================================
   확원 - progress.js (학습 기록 페이지)
   ========================================================= */

function totalStats() {
  let correct = 0;
  let total = 0;
  COURSES.forEach((c) => {
    const a = getCourseAccuracy(c.id);
    correct += a.correct;
    total += a.total;
  });
  return { correct, total, rate: total ? Math.round((correct / total) * 100) : 0 };
}

function renderToday() {
  const mount = document.getElementById("today-summary");
  const store = loadStore();
  const today = store.daily[todayKey()];
  const all = totalStats();

  if (all.total === 0) {
    mount.innerHTML = `
      <div class="empty" style="margin-bottom:44px">
        <h3>아직 푼 문제가 없습니다</h3>
        <p>과정을 하나 골라 개념을 읽고 문제를 풀면 여기에 기록이 쌓입니다.</p>
        <a class="btn btn-primary" href="courses.html">공부 시작하기</a>
      </div>`;
    return;
  }

  const solvedToday = today ? today.solved : 0;
  const correctToday = today ? today.correct : 0;
  const rateToday = solvedToday ? Math.round((correctToday / solvedToday) * 100) : 0;

  let todayCourseText = "오늘은 아직 문제를 풀지 않았습니다";
  if (today && Object.keys(today.byCourse).length) {
    todayCourseText = Object.keys(today.byCourse)
      .map((id) => {
        const c = getCourse(id);
        return c ? `${c.title} ${today.byCourse[id]}문제 풀이` : null;
      })
      .filter(Boolean)
      .join(" · ");
  }

  mount.innerHTML = `
    <h2 class="section-title">오늘의 학습</h2>
    <p class="section-sub">${escapeHTML(todayCourseText)}</p>
    <div class="summary-grid">
      <div class="summary-card accent">
        <p class="cap">오늘 푼 문제</p>
        <p class="big">${solvedToday}문제</p>
        <p class="sub">정답률 ${rateToday}%</p>
      </div>
      <div class="summary-card">
        <p class="cap">전체 정답률</p>
        <p class="big">${all.rate}%</p>
        <p class="sub">${all.correct} / ${all.total}문제</p>
      </div>
      <div class="summary-card">
        <p class="cap">공부한 날</p>
        <p class="big">${Object.keys(loadStore().daily).length}일</p>
        <p class="sub">꾸준히 이어 가세요</p>
      </div>
    </div>`;
}

function renderRecords() {
  const mount = document.getElementById("record-list");

  mount.innerHTML = COURSES.map((c) => {
    const percent = getCourseProgress(c.id);
    const acc = getCourseAccuracy(c.id);
    const lessons = LESSONS[c.id] || [];
    const rec = getCourseRecord(c.id);
    const doneLessons = lessons.filter((l) => rec.concepts[l.id] && rec.quiz[l.id]).length;
    const meta =
      acc.total > 0
        ? `단원 ${doneLessons}/${lessons.length} 완료 · 정답률 ${acc.rate}%`
        : `단원 ${lessons.length}개 · 아직 풀지 않음`;

    return `
      <article class="record-row">
        <div>
          <p class="rname">${escapeHTML(c.title)}</p>
          <p class="rmeta">${meta}</p>
        </div>
        ${progressBarHTML(percent, { label: c.title + " 진행률" })}
        <a class="btn btn-ghost" href="study.html?course=${c.id}">
          ${percent > 0 ? "이어서" : "시작"}
        </a>
      </article>`;
  }).join("");

  animateProgressBars(mount);
}

document.addEventListener("DOMContentLoaded", () => {
  renderToday();
  renderRecords();

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("모든 학습 기록을 지웁니다. 되돌릴 수 없습니다. 계속할까요?")) {
      resetAll();
      renderToday();
      renderRecords();
    }
  });
});
