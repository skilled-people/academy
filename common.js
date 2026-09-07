/* =========================================================
   확원 - 공통 스크립트 (모든 페이지에서 사용)
   - localStorage 저장/불러오기
   - 진행률 계산
   - 네비게이션 바 렌더링
   ========================================================= */

const STORE_KEY = "hwagwon:v1";

/* ---------- 저장소 ---------- */

function defaultStore() {
  return { courses: {}, daily: {} };
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultStore();
    if (!parsed.courses) parsed.courses = {};
    if (!parsed.daily) parsed.daily = {};
    return parsed;
  } catch (e) {
    console.warn("학습 기록을 불러오지 못해 새로 시작합니다.", e);
    return defaultStore();
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    return true;
  } catch (e) {
    console.warn("학습 기록을 저장하지 못했습니다.", e);
    return false;
  }
}

function getCourseRecord(courseId) {
  const store = loadStore();
  const rec = store.courses[courseId];
  if (rec && rec.concepts && rec.quiz) return rec;
  return { concepts: {}, quiz: {} };
}

/** 개념 학습 완료 여부 기록 */
function setConceptDone(courseId, lessonId, done) {
  const store = loadStore();
  if (!store.courses[courseId]) store.courses[courseId] = { concepts: {}, quiz: {} };
  if (done) store.courses[courseId].concepts[lessonId] = true;
  else delete store.courses[courseId].concepts[lessonId];
  saveStore(store);
}

/** 문제 풀이 결과 기록 */
function saveQuizResult(courseId, lessonId, correct, total) {
  const store = loadStore();
  if (!store.courses[courseId]) store.courses[courseId] = { concepts: {}, quiz: {} };

  const prev = store.courses[courseId].quiz[lessonId];
  store.courses[courseId].quiz[lessonId] = {
    correct: prev ? Math.max(prev.correct, correct) : correct,
    total: total,
    lastCorrect: correct,
    attempts: prev && prev.attempts ? prev.attempts + 1 : 1,
    updatedAt: new Date().toISOString(),
  };

  const key = todayKey();
  if (!store.daily[key]) store.daily[key] = { solved: 0, correct: 0, byCourse: {} };
  store.daily[key].solved += total;
  store.daily[key].correct += correct;
  store.daily[key].byCourse[courseId] = (store.daily[key].byCourse[courseId] || 0) + total;

  saveStore(store);
}

function todayKey(d) {
  const t = d || new Date();
  const mm = String(t.getMonth() + 1).padStart(2, "0");
  const dd = String(t.getDate()).padStart(2, "0");
  return `${t.getFullYear()}-${mm}-${dd}`;
}

function resetAll() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch (e) {
    console.warn("초기화 실패", e);
  }
}

/* ---------- 진행률 ---------- */

/**
 * 한 과정의 진행률(%)
 * 단원마다 [개념 학습 1칸 + 문제 풀이 1칸] 으로 계산합니다.
 */
function getCourseProgress(courseId) {
  const lessons = LESSONS[courseId] || [];
  if (lessons.length === 0) return 0;
  const rec = getCourseRecord(courseId);
  const totalUnits = lessons.length * 2;
  let done = 0;
  lessons.forEach((ls) => {
    if (rec.concepts[ls.id]) done += 1;
    if (rec.quiz[ls.id]) done += 1;
  });
  return Math.round((done / totalUnits) * 100);
}

/** 한 과정의 누적 정답 수 / 시도한 문제 수 */
function getCourseAccuracy(courseId) {
  const rec = getCourseRecord(courseId);
  let correct = 0;
  let total = 0;
  Object.keys(rec.quiz).forEach((k) => {
    correct += rec.quiz[k].correct || 0;
    total += rec.quiz[k].total || 0;
  });
  return { correct, total, rate: total ? Math.round((correct / total) * 100) : 0 };
}

function getCourse(courseId) {
  return COURSES.find((c) => c.id === courseId) || null;
}

function getLesson(courseId, lessonId) {
  const list = LESSONS[courseId] || [];
  return list.find((l) => l.id === lessonId) || null;
}

/* ---------- 공통 UI ---------- */

const NAV_ITEMS = [
  { href: "index.html", label: "홈", key: "home" },
  { href: "courses.html", label: "과정", key: "courses" },
  { href: "quiz.html", label: "문제", key: "quiz" },
  { href: "progress.html", label: "학습 기록", key: "progress" },
];

function renderHeader() {
  const mount = document.getElementById("site-header");
  if (!mount) return;
  const active = document.body.dataset.page || "";

  mount.innerHTML = `
    <div class="nav-inner">
      <a class="logo" href="index.html" aria-label="확원 홈으로">
        <span class="logo-mark" aria-hidden="true">π</span>
        <span class="logo-text">확원</span>
      </a>

      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu" aria-label="메뉴 열기">
        <span></span><span></span><span></span>
      </button>

      <nav class="nav-menu" id="nav-menu">
        <ul>
          ${NAV_ITEMS.map(
            (it) =>
              `<li><a href="${it.href}" class="${active === it.key ? "is-active" : ""}">${it.label}</a></li>`
          ).join("")}
        </ul>
        <a class="btn btn-primary nav-cta" href="courses.html">공부 시작하기</a>
      </nav>
    </div>
  `;

  const toggle = mount.querySelector(".nav-toggle");
  const menu = mount.querySelector(".nav-menu");
  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  });
  menu.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      menu.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function renderFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;
  mount.innerHTML = `
    <div class="footer-inner">
      <span class="footer-logo"><span aria-hidden="true">π</span> 확원</span>
      <p>원하는 공부를, 확실하게.</p>
      <p class="footer-note">학습 기록은 이 브라우저에만 저장됩니다.</p>
    </div>
  `;
}

/** 진행률 바 HTML */
function progressBarHTML(percent, opts) {
  const o = opts || {};
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return `
    <div class="progress ${o.small ? "progress-sm" : ""}">
      <div class="progress-track" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100" aria-label="${o.label || "학습 진행률"}">
        <div class="progress-fill" style="width:0%" data-target="${p}"></div>
      </div>
      ${o.hideValue ? "" : `<span class="progress-value">${p}%</span>`}
    </div>
  `;
}

/** 화면에 그려진 진행률 바에 애니메이션 적용 */
function animateProgressBars(root) {
  const scope = root || document;
  const fills = scope.querySelectorAll(".progress-fill[data-target]");
  requestAnimationFrame(() => {
    fills.forEach((el) => {
      el.style.width = el.dataset.target + "%";
    });
  });
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
});
