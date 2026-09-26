const TASKS_KEY = "aether-study-tasks";
const TIMER_KEY = "aether-study-timer-seconds";
const MATH_KEY = "aether-study-math-solved";
const DATES_KEY = "aether-study-dates";

const defaultTasks = [
  {
    id: "math-practice",
    title: "Math practice",
    detail: "Functions & graph review",
    done: false,
  },
  {
    id: "reading-notes",
    title: "Reading notes",
    detail: "Summarize today's chapter",
    done: false,
  },
  {
    id: "science-review",
    title: "Science review",
    detail: "Vocabulary & key concepts",
    done: false,
  },
];

function readJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function readNumber(key, fallback) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeNumber(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {}
}

const dateTarget = document.getElementById("study-date");

if (dateTarget) {
  dateTarget.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/* =========================
   ASSIGNMENTS
========================= */

let tasks = readJSON(TASKS_KEY, defaultTasks);

if (!Array.isArray(tasks) || tasks.length === 0) {
  tasks = defaultTasks.map((task) => ({ ...task }));
}

const taskList = document.getElementById("study-task-list");
const taskCount = document.getElementById("task-count");
const progressLabel = document.getElementById("progress-label");
const progressPercent = document.getElementById("progress-percent");
const progressRing = document.getElementById("progress-ring");
const taskForm = document.getElementById("study-add-task");
const taskInput = document.getElementById("study-task-input");

function saveTasks() {
  writeJSON(TASKS_KEY, tasks);
}

function renderTasks() {
  if (!taskList) return;

  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    const row = document.createElement("div");
    row.className = `study-task${task.done ? " done" : ""}`;

    const check = document.createElement("button");
    check.type = "button";
    check.className = `study-task-check${task.done ? "" : " pending"}`;
    check.textContent = task.done ? "✓" : String(index + 1);
    check.setAttribute(
      "aria-label",
      `${task.done ? "Mark incomplete" : "Mark complete"}: ${task.title}`
    );

    const main = document.createElement("button");
    main.type = "button";
    main.className = "study-task-main";

    const title = document.createElement("strong");
    title.textContent = task.title;

    const detail = document.createElement("span");
    detail.textContent = task.detail || "Personal study task";

    main.append(title, detail);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "study-task-delete";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${task.title}`);

    const toggle = () => {
      task.done = !task.done;
      saveTasks();
      renderTasks();
    };

    check.addEventListener("click", toggle);
    main.addEventListener("click", toggle);

    remove.addEventListener("click", () => {
      tasks = tasks.filter((current) => current.id !== task.id);
      saveTasks();
      renderTasks();
    });

    row.append(check, main, remove);
    taskList.appendChild(row);
  });

  const completed = tasks.filter((task) => task.done).length;
  const total = tasks.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  taskCount.textContent = `${total} ${total === 1 ? "task" : "tasks"}`;
  progressLabel.textContent = `${completed} of ${total} tasks complete`;
  progressPercent.textContent = `${percent}%`;

  progressRing.style.background =
    `radial-gradient(circle, #ffffff 58%, transparent 60%), ` +
    `conic-gradient(#687fe8 0 ${percent}%, #e3e8f1 ${percent}% 100%)`;
}

taskForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = taskInput.value.trim();
  if (!title) return;

  tasks.push({
    id: `study-task-${Date.now()}`,
    title,
    detail: "Personal study task",
    done: false,
  });

  taskInput.value = "";
  saveTasks();
  renderTasks();
});

renderTasks();

/* =========================
   FOCUS TIMER
========================= */

let timerSeconds = readNumber(TIMER_KEY, 25 * 60);

if (
  !Number.isFinite(timerSeconds) ||
  timerSeconds < 0 ||
  timerSeconds > 25 * 60
) {
  timerSeconds = 25 * 60;
}

let timerRunning = false;
let timerHandle = null;

const timerDisplay = document.getElementById("study-timer");
const timerMessage = document.getElementById("timer-message");
const timerToggle = document.getElementById("timer-toggle");
const timerReset = document.getElementById("timer-reset");

function renderTimer() {
  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const seconds = String(timerSeconds % 60).padStart(2, "0");

  timerDisplay.textContent = `${minutes}:${seconds}`;

  if (timerSeconds === 0) {
    timerMessage.textContent = "Focus block complete. Nice work.";
    timerToggle.textContent = "START AGAIN";
  } else if (timerRunning) {
    timerMessage.textContent = "Focus mode is running.";
    timerToggle.textContent = "PAUSE";
  } else {
    timerMessage.textContent =
      "One focused block, then take a short break.";
    timerToggle.textContent = "START SESSION";
  }
}

function stopTimer() {
  timerRunning = false;

  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }

  renderTimer();
}

function markFocusedToday() {
  const dates = readJSON(DATES_KEY, []);
  const today = new Date().toISOString().slice(0, 10);
  const next = Array.isArray(dates) ? [...dates] : [];

  if (!next.includes(today)) {
    next.push(today);
  }

  writeJSON(DATES_KEY, next.slice(-30));
  renderStreak();
}

function startTimer() {
  if (timerSeconds === 0) {
    timerSeconds = 25 * 60;
  }

  timerRunning = true;
  renderTimer();

  timerHandle = setInterval(() => {
    timerSeconds -= 1;

    if (timerSeconds <= 0) {
      timerSeconds = 0;
      writeNumber(TIMER_KEY, timerSeconds);
      markFocusedToday();
      stopTimer();
      return;
    }

    writeNumber(TIMER_KEY, timerSeconds);
    renderTimer();
  }, 1000);
}

timerToggle?.addEventListener("click", () => {
  if (timerRunning) {
    stopTimer();
  } else {
    startTimer();
  }
});

timerReset?.addEventListener("click", () => {
  stopTimer();
  timerSeconds = 25 * 60;
  writeNumber(TIMER_KEY, timerSeconds);
  renderTimer();
});

renderTimer();

/* =========================
   MATH WARM-UP
========================= */

const mathCard = document.getElementById("math-card");
const mathEquation = document.getElementById("math-equation");
const mathFeedback = document.getElementById("math-feedback");
const mathAnswers = document.getElementById("math-answers");
const mathNext = document.getElementById("math-next");

let mathSolved = readNumber(MATH_KEY, 0);
let mathQuestion = null;
let mathLocked = false;

function shuffle(values) {
  return [...values].sort(() => Math.random() - 0.5);
}

function makeMathQuestion() {
  const modes = ["add", "subtract", "multiply"];
  const mode = modes[Math.floor(Math.random() * modes.length)];

  let prompt;
  let answer;

  if (mode === "multiply") {
    const a = Math.floor(Math.random() * 9) + 3;
    const b = Math.floor(Math.random() * 9) + 3;
    prompt = `${a} × ${b} = ?`;
    answer = a * b;
  } else {
    const a = Math.floor(Math.random() * 40) + 12;
    const b = Math.floor(Math.random() * 20) + 3;
    const high = Math.max(a, b);
    const low = Math.min(a, b);

    if (mode === "subtract") {
      prompt = `${high} − ${low} = ?`;
      answer = high - low;
    } else {
      prompt = `${a} + ${b} = ?`;
      answer = a + b;
    }
  }

  const options = new Set([answer]);

  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 15) - 7;
    const candidate = answer + offset;

    if (offset !== 0 && candidate >= 0) {
      options.add(candidate);
    }
  }

  return {
    prompt,
    answer,
    options: shuffle([...options]),
  };
}

function renderMath() {
  mathLocked = false;
  mathQuestion = makeMathQuestion();
  mathCard.classList.remove("correct", "wrong");
  mathEquation.textContent = mathQuestion.prompt;
  mathFeedback.textContent = `Solved: ${mathSolved}`;
  mathAnswers.innerHTML = "";
  mathNext.hidden = true;

  mathQuestion.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(option);

    button.addEventListener("click", () => {
      if (mathLocked) return;

      if (option === mathQuestion.answer) {
        mathLocked = true;
        mathSolved += 1;
        writeNumber(MATH_KEY, mathSolved);

        mathCard.classList.remove("wrong");
        mathCard.classList.add("correct");
        mathFeedback.textContent = "Correct ✓";
        button.classList.add("correct");
        mathNext.hidden = false;
        return;
      }

      mathCard.classList.remove("wrong");
      void mathCard.offsetWidth;
      mathCard.classList.add("wrong");
      mathFeedback.textContent = "Not quite — try again.";

      setTimeout(() => {
        if (!mathLocked) {
          mathCard.classList.remove("wrong");
          mathFeedback.textContent = `Solved: ${mathSolved}`;
        }
      }, 650);
    });

    mathAnswers.appendChild(button);
  });
}

mathNext?.addEventListener("click", renderMath);
renderMath();

/* =========================
   STUDY STREAK
========================= */

const streakTarget = document.getElementById("study-streak");
const streakMessage = document.getElementById("streak-message");

function getWeekDays() {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];

  return labels.map((label, index) => {
    const date = new Date();
    const currentDay = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - currentDay + index);

    return {
      label,
      key: date.toISOString().slice(0, 10),
    };
  });
}

function renderStreak() {
  const dates = readJSON(DATES_KEY, []);
  const safeDates = Array.isArray(dates) ? dates : [];
  const week = getWeekDays();

  streakTarget.innerHTML = "";

  week.forEach((day) => {
    const bubble = document.createElement("span");
    bubble.textContent = day.label;
    bubble.title = day.key;

    if (safeDates.includes(day.key)) {
      bubble.classList.add("active");
    }

    streakTarget.appendChild(bubble);
  });

  const count = week.filter((day) => safeDates.includes(day.key)).length;

  streakMessage.textContent =
    count === 0
      ? "Finish a focus timer to start your streak."
      : `${count} focused ${count === 1 ? "day" : "days"} this week.`;
}

renderStreak();
