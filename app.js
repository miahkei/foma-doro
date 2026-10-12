const pageButtons = document.querySelectorAll('.nav-link[data-page]');
const pageLinks = document.querySelectorAll('[data-page-link]');
const pageViews = document.querySelectorAll('.page-view');
const todayLabel = document.getElementById('todayLabel');
let supabaseClient = null;
let currentUser = null;

todayLabel.textContent = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
}).format(new Date());

function showPage(pageName) {
  pageViews.forEach((view) => {
    const isCurrent = view.id === `page-${pageName}`;
    view.hidden = !isCurrent;
    view.classList.toggle('is-visible', isCurrent);
  });

  pageButtons.forEach((button) => {
    const isCurrent = button.dataset.page === pageName;
    button.classList.toggle('is-active', isCurrent);
    if (isCurrent) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  });
}

pageButtons.forEach((button) => {
  button.addEventListener('click', () => showPage(button.dataset.page));
});

pageLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showPage(link.dataset.pageLink);
    const target = document.getElementById(link.dataset.scrollTarget);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const schoolEvents = [
  { title: 'Enrollment', start: '2026-05-04', end: '2026-05-29' },
  { title: 'Opening of classes', start: '2026-06-08', end: '2026-06-11' },
  { title: 'Term 1 instruction', start: '2026-06-15', end: '2026-09-01' },
  { title: 'Term 1 end block', start: '2026-09-02', end: '2026-09-15' },
  { title: 'Term 2 instruction', start: '2026-09-16', end: '2026-12-04' },
  { title: 'Term 2 end block', start: '2026-12-07', end: '2026-12-18' },
  { title: 'Christmas break', start: '2026-12-19', end: '2027-01-03' },
  { title: 'Term 3 instruction', start: '2027-01-04', end: '2027-03-23' },
  { title: 'Term 3 end block', start: '2027-03-24', end: '2027-04-08' },
  { title: 'End of school year', start: '2027-04-08', end: '2027-04-08' },
];

const calendarMonth = document.getElementById('calendarMonth');
const calendarDays = document.getElementById('calendarDays');
const selectedDateTitle = document.getElementById('selectedDateTitle');
const dayEventsList = document.getElementById('dayEvents');
const dayEmpty = document.getElementById('dayEmpty');
const eventForm = document.getElementById('calendarEventForm');
const eventTitleInput = document.getElementById('eventTitle');
const eventDateInput = document.getElementById('eventDate');
const eventStorageKey = 'foma-doro-calendar-events';
const calendarNow = new Date();
let selectedDate = new Date(calendarNow.getFullYear(), calendarNow.getMonth(), calendarNow.getDate());

function loadCalendarEvents() {
  try {
    const savedEvents = JSON.parse(localStorage.getItem(eventStorageKey) || '[]');
    return Array.isArray(savedEvents)
      ? savedEvents.filter((event) => event && typeof event.title === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(event.date))
      : [];
  } catch {
    return [];
  }
}

let personalEvents = loadCalendarEvents();

function saveCalendarEvents() {
  localStorage.setItem(eventStorageKey, JSON.stringify(personalEvents));
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCalendarDate(date, options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) {
  return new Intl.DateTimeFormat('en', options).format(date);
}

function eventsForDate(key) {
  const fromSchool = schoolEvents
    .filter((event) => event.start <= key && event.end >= key)
    .map((event) => ({ ...event, personal: false }));
  const personal = personalEvents
    .filter((event) => event.date === key)
    .map((event) => ({ ...event, start: event.date, end: event.date, personal: true }));
  return [...fromSchool, ...personal];
}

function renderSelectedDay() {
  const key = dateKey(selectedDate);
  const events = eventsForDate(key);
  selectedDateTitle.textContent = formatCalendarDate(selectedDate);
  eventDateInput.value = key;
  dayEventsList.replaceChildren();
  dayEmpty.hidden = events.length > 0;

  events.forEach((event) => {
    const item = document.createElement('li');
    item.className = `day-event${event.personal ? ' is-personal' : ''}`;
    const marker = document.createElement('span');
    marker.className = 'day-event-marker';
    marker.setAttribute('aria-hidden', 'true');
    const details = document.createElement('span');
    details.className = 'day-event-details';
    const title = document.createElement('strong');
    title.textContent = event.title;
    details.append(title);
    if (!event.personal && event.start !== event.end) {
      const range = document.createElement('small');
      range.textContent = `${formatCalendarDate(parseCalendarDate(event.start), { month: 'short', day: 'numeric' })} - ${formatCalendarDate(parseCalendarDate(event.end), { month: 'short', day: 'numeric' })}`;
      details.append(range);
    }
    item.append(marker, details);

    if (event.personal) {
      const removeButton = document.createElement('button');
      removeButton.className = 'remove-event';
      removeButton.type = 'button';
      removeButton.textContent = 'x';
      removeButton.setAttribute('aria-label', `Delete event ${event.title}`);
      removeButton.addEventListener('click', () => {
        void deletePersonalEvent(event);
      });
      item.append(removeButton);
    }
    dayEventsList.append(item);
  });
}

function parseCalendarDate(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function renderCalendar() {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthLength = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((monthStart.getDay() + monthLength) / 7) * 7;
  const todayKey = dateKey(calendarNow);
  const selectedKey = dateKey(selectedDate);

  calendarMonth.textContent = formatCalendarDate(monthStart, { month: 'long', year: 'numeric' });
  document.querySelector('.calendar-grid').setAttribute('aria-label', `${calendarMonth.textContent} calendar`);
  calendarDays.replaceChildren();

  for (let index = 0; index < cellCount; index += 1) {
    const date = new Date(year, month, index - monthStart.getDay() + 1);
    const key = dateKey(date);
    const allEvents = eventsForDate(key);
    const inCurrentMonth = date.getMonth() === month;
    const schoolStarts = schoolEvents.filter((event) => event.start === key);
    const personalForDate = personalEvents.filter((event) => event.date === key);
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    cell.setAttribute('role', 'gridcell');

    const dayButton = document.createElement('button');
    dayButton.type = 'button';
    dayButton.className = 'calendar-day-button';
    if (!inCurrentMonth) dayButton.classList.add('is-outside-month');
    if (key === todayKey) dayButton.classList.add('is-today');
    if (key === selectedKey) dayButton.classList.add('is-selected');
    dayButton.setAttribute('aria-pressed', String(key === selectedKey));
    dayButton.setAttribute('aria-label', `${formatCalendarDate(date)}, ${allEvents.length} events`);

    const number = document.createElement('span');
    number.className = 'day-number';
    number.textContent = String(date.getDate());
    dayButton.append(number);

    const markers = document.createElement('span');
    markers.className = 'day-markers';
    if (allEvents.some((event) => !event.personal)) {
      const schoolMarker = document.createElement('i');
      schoolMarker.className = 'calendar-marker-school';
      schoolMarker.setAttribute('aria-hidden', 'true');
      markers.append(schoolMarker);
    }
    if (personalForDate.length > 0) {
      const personalMarker = document.createElement('i');
      personalMarker.className = 'calendar-marker-personal';
      personalMarker.setAttribute('aria-hidden', 'true');
      markers.append(personalMarker);
    }
    dayButton.append(markers);

    const visibleLabels = [...schoolStarts, ...personalForDate].slice(0, 2);
    visibleLabels.forEach((event) => {
      const label = document.createElement('span');
      label.className = `calendar-event-chip${event.date ? ' is-personal' : ''}`;
      label.textContent = event.title;
      dayButton.append(label);
    });
    if (schoolStarts.length + personalForDate.length > 2) {
      const more = document.createElement('span');
      more.className = 'calendar-more';
      more.textContent = `+${schoolStarts.length + personalForDate.length - 2} more`;
      dayButton.append(more);
    }

    dayButton.addEventListener('click', () => {
      selectedDate = date;
      renderCalendar();
    });
    cell.append(dayButton);
    calendarDays.append(cell);
  }

  renderSelectedDay();
}

document.querySelectorAll('[data-calendar-shift]').forEach((button) => {
  button.addEventListener('click', () => {
    selectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + Number(button.dataset.calendarShift), 1);
    renderCalendar();
  });
});

document.getElementById('calendarToday').addEventListener('click', () => {
  selectedDate = new Date(calendarNow.getFullYear(), calendarNow.getMonth(), calendarNow.getDate());
  renderCalendar();
});

eventForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = eventTitleInput.value.trim();
  const date = eventDateInput.value;
  if (!title || !date) return;

  const submitButton = eventForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  let savedEvent;
  if (currentUser && supabaseClient) {
    try {
      savedEvent = await createCloudCalendarEvent(title, date);
    } catch (error) {
      setAccountStatus('Sync error');
      setAccountMessage(`Your event could not be synced: ${error.message}`);
      submitButton.disabled = false;
      return;
    }
  } else {
    savedEvent = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, title, date };
    personalEvents.push(savedEvent);
    saveCalendarEvents();
  }
  selectedDate = parseCalendarDate(date);
  eventForm.reset();
  renderCalendar();
  eventTitleInput.focus();
  submitButton.disabled = false;
});

const timerDisplay = document.getElementById('timerDisplay');
const timerFace = document.getElementById('timerFace');
const timerMode = document.getElementById('timerMode');
const timerHint = document.getElementById('timerHint');
const timerStatus = document.getElementById('timerStatus');
const toggleTimerButton = document.getElementById('toggleTimer');
const resetTimerButton = document.getElementById('resetTimer');
const presetButtons = document.querySelectorAll('.preset-button');
const sessionCount = document.getElementById('sessionCount');
const sessionTargetDisplay = document.getElementById('sessionTargetDisplay');
const sessionProgressBar = document.getElementById('sessionProgressBar');
const sessionPlanKey = 'foma-doro-session-plan';
const sessionGoalForm = document.getElementById('sessionGoalForm');
const goalPresetInputs = document.querySelectorAll('input[name="goalPreset"]');
const customSessionGoal = document.getElementById('customSessionGoal');
const goalPreviewCount = document.getElementById('goalPreviewCount');
const goalStatus = document.getElementById('goalStatus');
const setGoalButton = document.getElementById('setGoalButton');

function loadSessionPlan() {
  try {
    const savedPlan = JSON.parse(localStorage.getItem(sessionPlanKey) || '{}');
    if (savedPlan.confirmed !== true
      || savedPlan.goalDate !== dateKey(new Date())
      || !Number.isInteger(savedPlan.goal)
      || savedPlan.goal < 1
      || savedPlan.goal > 8) {
      return { goal: null, completed: 0 };
    }
    return {
      completed: Number.isInteger(savedPlan.completed) && savedPlan.completed >= 0 ? savedPlan.completed : 0,
      goal: savedPlan.goal,
    };
  } catch {
    return { goal: null, completed: 0 };
  }
}

const savedSessionPlan = loadSessionPlan();
let sessionGoal = savedSessionPlan.goal;
let completedSessions = sessionGoal === null ? 0 : Math.min(savedSessionPlan.completed, sessionGoal);
let planComplete = sessionGoal !== null && completedSessions >= sessionGoal;
let timerHasStarted = false;
let pendingSessionGoal = null;

function saveSessionPlan() {
  if (sessionGoal === null) {
    localStorage.removeItem(sessionPlanKey);
    return;
  }
  localStorage.setItem(sessionPlanKey, JSON.stringify({
    confirmed: true,
    goal: sessionGoal,
    goalDate: dateKey(new Date()),
    completed: completedSessions,
  }));
}

function renderSessionCounter() {
  sessionCount.textContent = String(completedSessions);
  sessionTargetDisplay.textContent = sessionGoal === null ? '--' : String(sessionGoal);
  sessionProgressBar.style.width = sessionGoal === null ? '0%' : `${Math.min(100, (completedSessions / sessionGoal) * 100)}%`;
  sessionProgressBar.parentElement.parentElement.setAttribute('aria-label', sessionGoal === null
    ? 'No daily Pomodoro goal set'
    : `${completedSessions} of ${sessionGoal} Pomodoro sessions completed`);
}

const studyActivityKey = 'foma-doro-study-days';
const currentStreakDisplay = document.getElementById('currentStreak');
const streakDaysList = document.getElementById('streakDays');
const streakSummary = document.getElementById('streakSummary');

function loadStudyDays() {
  try {
    const savedDays = JSON.parse(localStorage.getItem(studyActivityKey) || '[]');
    return Array.isArray(savedDays)
      ? [...new Set(savedDays.filter((day) => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)))]
      : [];
  } catch {
    return [];
  }
}

let studyDays = loadStudyDays();

function renderWeeklyStreak() {
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayKey = dateKey(todayDate);
  const studiedDays = new Set(studyDays);
  const weekStart = new Date(todayDate);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekdayFormatter = new Intl.DateTimeFormat('en', { weekday: 'short' });

  streakDaysList.replaceChildren();
  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + dayOffset);
    const dayKey = dateKey(dayDate);
    const studied = studiedDays.has(dayKey);
    const isFuture = dayDate > todayDate;
    const day = document.createElement('li');
    day.className = `streak-day${studied ? ' is-studied' : ''}${dayKey === todayKey ? ' is-today' : ''}${isFuture ? ' is-future' : ''}`;
    day.setAttribute('aria-label', `${formatCalendarDate(dayDate, { weekday: 'long', month: 'long', day: 'numeric' })}: ${studied ? 'study session completed' : isFuture ? 'upcoming' : 'no completed study session'}`);

    const name = document.createElement('span');
    name.className = 'streak-day-name';
    name.textContent = weekdayFormatter.format(dayDate);
    const number = document.createElement('span');
    number.className = 'streak-day-number';
    number.textContent = String(dayDate.getDate());
    const mark = document.createElement('span');
    mark.className = 'streak-day-mark';
    mark.textContent = studied ? 'DONE' : isFuture ? '' : '-';
    day.append(name, number, mark);
    streakDaysList.append(day);
  }

  let streakAnchor = new Date(todayDate);
  if (!studiedDays.has(todayKey)) streakAnchor.setDate(streakAnchor.getDate() - 1);
  let streakLength = 0;
  while (studiedDays.has(dateKey(streakAnchor))) {
    streakLength += 1;
    streakAnchor.setDate(streakAnchor.getDate() - 1);
  }
  currentStreakDisplay.textContent = String(streakLength);
  streakSummary.textContent = streakLength === 0
    ? 'Complete a focus session to start your streak.'
    : `${streakLength} ${streakLength === 1 ? 'day' : 'days'} in a row. Keep it going with a focus session today.`;
}

function recordStudyDay() {
  const todayKey = dateKey(new Date());
  if (!studyDays.includes(todayKey)) {
    studyDays.push(todayKey);
    if (currentUser && supabaseClient) {
      void saveStudyDayToCloud(todayKey).catch((error) => {
        setAccountStatus('Sync error');
        setAccountMessage(`Your streak could not be synced: ${error.message}`);
      });
    } else {
      localStorage.setItem(studyActivityKey, JSON.stringify(studyDays));
    }
  }
  renderWeeklyStreak();
}

function renderGoalSelection() {
  goalPresetInputs.forEach((input) => {
    const selected = Number(input.value) === pendingSessionGoal;
    input.checked = selected;
    input.closest('.goal-choice').classList.toggle('is-selected', selected);
  });
  goalPreviewCount.textContent = String(pendingSessionGoal ?? sessionGoal ?? '--');
  setGoalButton.disabled = pendingSessionGoal === null || pendingSessionGoal === sessionGoal;

  if (pendingSessionGoal !== null && pendingSessionGoal !== sessionGoal) {
    goalStatus.textContent = sessionGoal === null
      ? `Ready to set ${pendingSessionGoal} focus sessions for today.`
      : `Changing to ${pendingSessionGoal} sessions will reset today's count.`;
  } else if (sessionGoal !== null) {
    goalStatus.textContent = `Today's goal is set to ${sessionGoal} sessions. Choose a new pace to update it.`;
  } else {
    goalStatus.textContent = "Choose a pace to set today's goal.";
  }
}

goalPresetInputs.forEach((input) => {
  input.addEventListener('change', () => {
    if (!input.checked) return;
    pendingSessionGoal = Number(input.value);
    customSessionGoal.value = '';
    renderGoalSelection();
  });
});

customSessionGoal.addEventListener('change', () => {
  pendingSessionGoal = customSessionGoal.value === '' ? null : Number(customSessionGoal.value);
  goalPresetInputs.forEach((input) => {
    input.checked = false;
    input.closest('.goal-choice').classList.remove('is-selected');
  });
  renderGoalSelection();
});

sessionGoalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (pendingSessionGoal === null || pendingSessionGoal === sessionGoal) return;

  stopTimer();
  sessionGoal = pendingSessionGoal;
  completedSessions = 0;
  planComplete = false;
  timerHasStarted = false;
  phase = 'focus';
  remainingSeconds = workMinutes * 60;
  phaseDuration = remainingSeconds;
  saveSessionPlan();
  renderSessionCounter();
  renderTimer();
  renderGoalSelection();
});

let workMinutes = 25;
let restMinutes = 5;
let phase = 'focus';
let remainingSeconds = workMinutes * 60;
let phaseDuration = remainingSeconds;
let deadline = 0;
let timerInterval = null;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(remainingSeconds);
  const elapsed = phaseDuration - remainingSeconds;
  const progress = phaseDuration > 0 ? (elapsed / phaseDuration) * 360 : 0;
  timerFace.style.setProperty('--progress', `${progress}deg`);
  timerMode.textContent = sessionGoal === null ? 'SET A DAILY GOAL' : planComplete ? 'GOAL COMPLETE' : (phase === 'focus' ? 'FOCUS SESSION' : 'BREAK TIME');
  timerStatus.textContent = sessionGoal === null ? 'NO GOAL' : planComplete ? 'DONE' : (timerInterval ? (phase === 'focus' ? 'FOCUSING' : 'ON BREAK') : 'READY');
  timerStatus.classList.toggle('is-break', phase === 'break');
  timerHint.textContent = sessionGoal === null
    ? 'Choose a session goal to begin'
    : planComplete
    ? 'You reached your session goal'
    : timerInterval
    ? (phase === 'focus' ? 'Stay with it, you are doing great' : 'Step away for a little while')
    : (phase === 'focus' ? 'Time to get started' : 'Ready for a short break');
  toggleTimerButton.disabled = sessionGoal === null;
  resetTimerButton.disabled = sessionGoal === null;
  toggleTimerButton.textContent = sessionGoal === null
    ? 'Set a daily goal first'
    : timerInterval
    ? 'Pause session'
    : planComplete
      ? 'Start new plan'
      : timerHasStarted
        ? 'Resume session'
        : 'Start focusing';
}

function stopTimer() {
  window.clearInterval(timerInterval);
  timerInterval = null;
}

function updateTimer() {
  remainingSeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));

  if (remainingSeconds === 0) {
    if (phase === 'focus') {
      completedSessions += 1;
      saveSessionPlan();
      renderSessionCounter();
      recordStudyDay();
      if (completedSessions >= sessionGoal) {
        stopTimer();
        planComplete = true;
        timerHasStarted = false;
        phaseDuration = workMinutes * 60;
        renderTimer();
        return;
      }
      phase = 'break';
      remainingSeconds = restMinutes * 60;
    } else {
      phase = 'focus';
      remainingSeconds = workMinutes * 60;
    }
    phaseDuration = remainingSeconds;
    deadline = Date.now() + remainingSeconds * 1000;
  }

  renderTimer();
}

function startTimer() {
  if (sessionGoal === null) return;

  if (timerInterval) {
    remainingSeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    if (remainingSeconds === 0) {
      updateTimer();
      if (!timerInterval) return;
    }
    stopTimer();
    renderTimer();
    return;
  }

  if (planComplete) {
    completedSessions = 0;
    planComplete = false;
    phase = 'focus';
    remainingSeconds = workMinutes * 60;
    phaseDuration = remainingSeconds;
    saveSessionPlan();
    renderSessionCounter();
  }

  deadline = Date.now() + remainingSeconds * 1000;
  timerHasStarted = true;
  timerInterval = window.setInterval(updateTimer, 250);
  renderTimer();
}

function resetTimer() {
  stopTimer();
  phase = 'focus';
  remainingSeconds = workMinutes * 60;
  phaseDuration = remainingSeconds;
  timerHasStarted = false;
  planComplete = false;
  completedSessions = 0;
  saveSessionPlan();
  renderSessionCounter();
  renderTimer();
}

toggleTimerButton.addEventListener('click', startTimer);
resetTimerButton.addEventListener('click', resetTimer);

presetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    workMinutes = Number(button.dataset.work);
    restMinutes = Number(button.dataset.rest);
    presetButtons.forEach((preset) => {
      const isSelected = preset === button;
      preset.classList.toggle('is-selected', isSelected);
      preset.setAttribute('aria-pressed', String(isSelected));
    });
    resetTimer();
  });
});

const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('newTask');
const taskList = document.getElementById('tasksList');
const taskEmpty = document.getElementById('tasksEmpty');
const taskPreview = document.getElementById('taskPreview');
const remainingCount = document.getElementById('remainingCount');
const storageKey = 'foma-doro-tasks';

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(savedTasks)
      ? savedTasks.filter((task) => task && typeof task.text === 'string')
      : [];
  } catch {
    return [];
  }
}

let tasks = loadTasks();

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function renderTasks() {
  taskList.replaceChildren();
  const remainingTasks = tasks.filter((task) => !task.complete);
  remainingCount.textContent = String(remainingTasks.length);
  taskEmpty.hidden = tasks.length > 0;

  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item${task.complete ? ' is-complete' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.className = 'task-check';
    checkbox.type = 'checkbox';
    checkbox.checked = task.complete;
    checkbox.setAttribute('aria-label', `Mark ${task.text} ${task.complete ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => {
      task.complete = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const priorityButton = document.createElement('button');
    priorityButton.className = `priority-button${task.priority ? ' is-priority' : ''}`;
    priorityButton.type = 'button';
    priorityButton.textContent = task.priority ? '*' : '+';
    priorityButton.setAttribute('aria-label', `${task.priority ? 'Remove priority from' : 'Mark as priority'} ${task.text}`);
    priorityButton.setAttribute('aria-pressed', String(task.priority));
    priorityButton.addEventListener('click', () => {
      task.priority = !task.priority;
      saveTasks();
      renderTasks();
    });

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.type = 'button';
    deleteButton.textContent = 'x';
    deleteButton.setAttribute('aria-label', `Delete ${task.text}`);
    deleteButton.addEventListener('click', () => {
      tasks = tasks.filter((entry) => entry.id !== task.id);
      saveTasks();
      renderTasks();
    });

    item.append(checkbox, text, priorityButton, deleteButton);
    taskList.append(item);
  });

  const previewTasks = tasks;
  taskPreview.replaceChildren();
  if (previewTasks.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-preview';
    emptyItem.textContent = 'Your task list is empty.';
    taskPreview.append(emptyItem);
  } else {
    previewTasks.forEach((task) => {
      const item = document.createElement('li');
      item.className = `preview-task${task.complete ? ' is-complete' : ''}${task.priority ? ' is-priority' : ''}`;
      const dot = document.createElement('span');
      dot.className = 'preview-dot';
      dot.setAttribute('aria-hidden', 'true');
      const text = document.createElement('span');
      text.textContent = task.text;
      text.setAttribute('aria-label', `${task.text}${task.complete ? ', completed' : ''}${task.priority ? ', priority' : ''}`);
      item.append(dot, text);
      taskPreview.append(item);
    });
  }
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;

  tasks.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text,
    complete: false,
    priority: false,
  });
  saveTasks();
  renderTasks();
  taskForm.reset();
  taskInput.focus();
});

const accountButton = document.getElementById('accountButton');
const accountStatus = document.getElementById('accountStatus');
const accountDialog = document.getElementById('accountDialog');
const accountClose = document.getElementById('accountClose');
const accountForm = document.getElementById('accountForm');
const accountEmail = document.getElementById('accountEmail');
const accountPassword = document.getElementById('accountPassword');
const accountSubmit = document.getElementById('accountSubmit');
const accountModeToggle = document.getElementById('accountModeToggle');
const accountMessage = document.getElementById('accountMessage');
const accountConfigNote = document.getElementById('accountConfigNote');
let accountMode = 'signin';
let accountStateKey = null;
let accountSyncVersion = 0;

function setAccountStatus(message) {
  accountStatus.textContent = message;
  accountStatus.title = message;
}

function setAccountMessage(message) {
  accountMessage.textContent = message;
}

function updateAccountFormMode() {
  const signingUp = accountMode === 'signup';
  document.getElementById('accountDialogTitle').textContent = signingUp ? 'Create your account' : 'Sign in';
  accountSubmit.textContent = signingUp ? 'Create account' : 'Sign in';
  accountPassword.autocomplete = signingUp ? 'new-password' : 'current-password';
  accountModeToggle.textContent = signingUp ? 'Already have an account? Sign in' : 'New here? Create an account';
}

async function migrateGuestCalendar(user) {
  const migrationKey = `foma-doro-calendar-migrated-${user.id}`;
  if (localStorage.getItem(migrationKey)) return;

  const guestEvents = loadCalendarEvents();
  const { data: existingEvents, error: readError } = await supabaseClient
    .from('calendar_events')
    .select('title,event_date')
    .eq('user_id', user.id);
  if (readError) throw readError;

  const existing = new Set(existingEvents.map((event) => `${event.title.toLowerCase()}|${event.event_date}`));
  const eventsToImport = guestEvents.filter((event) => !existing.has(`${event.title.toLowerCase()}|${event.date}`));
  if (eventsToImport.length > 0) {
    const { error } = await supabaseClient.from('calendar_events').insert(eventsToImport.map((event) => ({
      user_id: user.id,
      title: event.title,
      event_date: event.date,
    })));
    if (error) throw error;
  }
  localStorage.setItem(migrationKey, 'true');
}

async function migrateGuestStudyDays(user) {
  const migrationKey = `foma-doro-study-days-migrated-${user.id}`;
  const pendingKey = `foma-doro-pending-study-days-${user.id}`;
  const guestDays = migrationKey ? loadStudyDays() : [];
  let pendingDays = [];
  try {
    pendingDays = JSON.parse(localStorage.getItem(pendingKey) || '[]');
  } catch {
    pendingDays = [];
  }

  const daysToImport = [...new Set([
    ...(localStorage.getItem(migrationKey) ? [] : guestDays),
    ...(Array.isArray(pendingDays) ? pendingDays : []),
  ])];
  if (daysToImport.length > 0) {
    const { error } = await supabaseClient.from('study_days').upsert(
      daysToImport.map((day) => ({ user_id: user.id, study_date: day })),
      { onConflict: 'user_id,study_date' },
    );
    if (error) throw error;
    localStorage.removeItem(pendingKey);
  }
  if (!localStorage.getItem(migrationKey)) localStorage.setItem(migrationKey, 'true');
}

async function syncAccountData(user, version) {
  setAccountStatus('Syncing account');
  try {
    await migrateGuestCalendar(user);
    await migrateGuestStudyDays(user);
    const [calendarResult, studyDaysResult] = await Promise.all([
      supabaseClient.from('calendar_events').select('id,title,event_date').eq('user_id', user.id).order('event_date'),
      supabaseClient.from('study_days').select('study_date').eq('user_id', user.id).order('study_date'),
    ]);
    if (calendarResult.error) throw calendarResult.error;
    if (studyDaysResult.error) throw studyDaysResult.error;
    if (version !== accountSyncVersion || currentUser?.id !== user.id) return;

    personalEvents = calendarResult.data.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.event_date,
    }));
    studyDays = [...new Set(studyDaysResult.data.map((day) => day.study_date))];
    renderCalendar();
    renderWeeklyStreak();
    setAccountStatus(user.email || 'Synced');
    setAccountMessage('Calendar and study streak are synced to your account.');
  } catch (error) {
    if (version !== accountSyncVersion) return;
    setAccountStatus('Sync error');
    setAccountMessage(`Your account is signed in, but data did not sync: ${error.message}`);
  }
}

function applyAccountSession(session) {
  const user = session?.user || null;
  const nextStateKey = user?.id || 'guest';
  if (nextStateKey === accountStateKey) return;

  accountStateKey = nextStateKey;
  accountSyncVersion += 1;
  const version = accountSyncVersion;
  currentUser = user;

  if (!user) {
    accountButton.textContent = 'Sign in';
    setAccountStatus(supabaseClient ? 'Guest mode' : 'Guest mode');
    personalEvents = loadCalendarEvents();
    studyDays = loadStudyDays();
    renderCalendar();
    renderWeeklyStreak();
    return;
  }

  accountButton.textContent = 'Sign out';
  setAccountStatus('Syncing account');
  accountPassword.value = '';
  setAccountMessage('');
  if (accountDialog.open) accountDialog.close();
  void syncAccountData(user, version);
}

async function createCloudCalendarEvent(title, date) {
  const userId = currentUser.id;
  const { data, error } = await supabaseClient
    .from('calendar_events')
    .insert({ user_id: userId, title, event_date: date })
    .select('id,title,event_date')
    .single();
  if (error) throw error;
  const savedEvent = { id: data.id, title: data.title, date: data.event_date };
  if (currentUser?.id === userId) personalEvents.push(savedEvent);
  return savedEvent;
}

async function deletePersonalEvent(event) {
  if (currentUser && supabaseClient) {
    const userId = currentUser.id;
    const { error } = await supabaseClient
      .from('calendar_events')
      .delete()
      .eq('id', event.id)
      .eq('user_id', userId);
    if (error) {
      setAccountStatus('Sync error');
      setAccountMessage(`Your event could not be deleted: ${error.message}`);
      return;
    }
  }

  personalEvents = personalEvents.filter((savedEvent) => savedEvent.id !== event.id);
  if (!currentUser) saveCalendarEvents();
  renderCalendar();
}

async function saveStudyDayToCloud(studyDate) {
  if (!currentUser || !supabaseClient) return;
  const userId = currentUser.id;
  const { error } = await supabaseClient.from('study_days').upsert(
    { user_id: userId, study_date: studyDate },
    { onConflict: 'user_id,study_date' },
  );
  if (error) {
    const pendingKey = `foma-doro-pending-study-days-${userId}`;
    let pendingDays = [];
    try {
      pendingDays = JSON.parse(localStorage.getItem(pendingKey) || '[]');
    } catch {
      pendingDays = [];
    }
    if (!Array.isArray(pendingDays)) pendingDays = [];
    if (!pendingDays.includes(studyDate)) pendingDays.push(studyDate);
    localStorage.setItem(pendingKey, JSON.stringify(pendingDays));
    throw error;
  }
}

function initializeAccount() {
  const config = window.FOMA_SUPABASE_CONFIG || {};
  const configured = typeof config.url === 'string'
    && /^https?:\/\//.test(config.url)
    && typeof config.anonKey === 'string'
    && config.anonKey.length > 20;
  const libraryAvailable = Boolean(window.supabase?.createClient);

  if (configured && libraryAvailable) {
    supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    accountConfigNote.hidden = true;
    accountSubmit.disabled = false;
    accountModeToggle.hidden = false;
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => applyAccountSession(session), 0);
    });
    void supabaseClient.auth.getSession().then(({ data, error }) => {
      if (error) {
        setAccountStatus('Sign-in unavailable');
        setAccountMessage(error.message);
        return;
      }
      applyAccountSession(data.session);
    });
  } else {
    accountConfigNote.hidden = false;
    accountSubmit.disabled = true;
    accountModeToggle.hidden = true;
    setAccountStatus(libraryAvailable ? 'Cloud setup needed' : 'Cloud library unavailable');
  }
}

accountButton.addEventListener('click', async () => {
  if (currentUser && supabaseClient) {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      setAccountStatus('Sign-out error');
      setAccountMessage(error.message);
    }
    return;
  }
  accountMode = 'signin';
  updateAccountFormMode();
  setAccountMessage('');
  accountDialog.showModal();
});

accountClose.addEventListener('click', () => accountDialog.close());
accountModeToggle.addEventListener('click', () => {
  accountMode = accountMode === 'signin' ? 'signup' : 'signin';
  updateAccountFormMode();
  setAccountMessage('');
});

accountForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabaseClient) return;

  accountSubmit.disabled = true;
  setAccountMessage(accountMode === 'signup' ? 'Creating your account…' : 'Signing in…');
  const email = accountEmail.value.trim();
  const password = accountPassword.value;
  const result = accountMode === 'signup'
    ? await supabaseClient.auth.signUp({ email, password })
    : await supabaseClient.auth.signInWithPassword({ email, password });
  accountSubmit.disabled = false;

  if (result.error) {
    setAccountMessage(result.error.message);
    return;
  }
  if (accountMode === 'signup' && !result.data.session) {
    setAccountMessage('Check your email for a confirmation link, then sign in.');
    return;
  }
  setAccountMessage('Account request complete.');
});

renderTimer();
renderSessionCounter();
renderGoalSelection();
renderWeeklyStreak();
renderCalendar();
renderTasks();
initializeAccount();