const app = document.querySelector("#app");

const missionDefinitions = [
  { id: 1, type: "score", label: "문기부스 2", title: "공 넣기", score: 93 },
  { id: 2, type: "score", label: "문기부스 3", title: "시간 맞추기", score: 82 },
  { id: 3, type: "score", label: "문기부스 4", title: "말판 대결", score: 90 },
  { id: 4, type: "code", label: "공연3", title: "글자조각3" },
  { id: 5, type: "code", label: "공연4", title: "글자조각4" },
  { id: 6, type: "find", label: "방문3", title: "환전소 방문" },
  { id: 7, type: "find", label: "방문2", title: "문기부스 방문" },
  { id: 8, type: "find", label: "방문1", title: "포토부스 방문" },
  { id: 9, type: "code", label: "공연2", title: "글자조각2" },
  { id: 10, type: "code", label: "공연1", title: "글자조각1" },
  { id: 11, type: "find", label: "문기부스 참여", title: "문기부스 참여" },
  { id: 12, type: "score", label: "문기부스1", title: "병뚜껑 컬링", score: 75 },
];

const state = {
  view: "login",
  selectedMissionId: null,
  pendingMissionId: null,
  pendingMode: "nfc",
  completedIds: new Set(),
  loginError: false,
  lastCompletedId: null,
  animateMissionId: null,
  codeError: false,
};

const icons = {
  processing: "./assets/status-processing.svg",
  success: "./assets/status-success.svg",
};

function missionNumber(id) {
  return String(id).padStart(2, "0");
}

function getMission(id) {
  return missionDefinitions.find((mission) => mission.id === Number(id));
}

function badge(label, tone = "soft") {
  return `<span class="badge badge--${tone}">${label}</span>`;
}

function header({ eyebrow = "나의 축제 도시", title = "김카일 님" } = {}) {
  return `
    <header class="header">
      <div class="header-user">
        <p class="eyebrow">${eyebrow}</p>
        <p class="title">${title}</p>
      </div>
      ${badge("KAILAI 27")}
    </header>
  `;
}

function stats() {
  const totalScore = missionDefinitions.reduce(
    (sum, mission) => sum + (state.completedIds.has(mission.id) ? mission.score || 0 : 0),
    0,
  );

  return `
    <section class="stats" aria-label="나의 축제 현황">
      <article class="stat-card">
        <p class="stat-label">완료한 미션</p>
        <p class="stat-value">${state.completedIds.size} / 12</p>
      </article>
      <article class="stat-card">
        <p class="stat-label">총점</p>
        <p class="stat-value">${totalScore}점</p>
      </article>
    </section>
  `;
}

function boardVisual({ complete = false, interactive = true } = {}) {
  const locations = [[172,86],[215,111],[258,136],[301,161],[258,186],[215,211],[172,236],[129,211],[86,186],[43,161],[86,136],[129,111]];
  const tiles = locations.map(([x,y], index) => {
    const mission = getMission(index + 1);
    const done = complete || state.completedIds.has(mission.id);
    const floors = done ? (mission.type === "score" ? Math.min(6, Math.max(1, Math.ceil((mission.score || 0) / 100 * 6))) : 1) : 0;
    const height = floors * 14;
    const top = y - height;
    const rise = interactive && state.animateMissionId === mission.id;
    return `<g class="mission-tile" data-action="${interactive ? "select-mission" : ""}" data-mission-id="${mission.id}" ${interactive ? 'role="button" tabindex="0"' : ""} aria-label="미션 ${missionNumber(mission.id)} ${done ? "완료" : "미완료"}">
      <title>MISSION ${missionNumber(mission.id)}</title>
      <path d="M${x-34} ${y} l34 -19.75 34 19.75 -34 19.75z" fill="${done ? "#ffcf75" : "#f1f1e7"}" stroke="#e2ce8f" stroke-width="1.5"/>
      ${done ? `<g class="building${done ? " is-complete" : ""}${rise ? " is-rising" : ""}" style="--building-base:${y+12}px" data-height="${height}" data-floors="${floors}">
        <path d="M${x-22} ${top} L${x} ${top+12.8} V${y+12} L${x-22} ${y-0.8}Z" fill="${done ? "#e8a047" : "#d9ddd5"}"/>
        <path d="M${x} ${top+12.8} L${x+22} ${top} V${y-0.8} L${x} ${y+12}Z" fill="${done ? "#db933b" : "#c7cec3"}"/>
        <path d="M${x} ${top-12.8} L${x+22} ${top} L${x} ${top+12.8} L${x-22} ${top}Z" fill="${done ? "#fbb35b" : "#e9ece5"}"/>
        ${done ? Array.from({length:Math.max(0,Math.floor(height/14)-1)},(_,i)=>`<path d="M${x-22} ${y-(i+1)*14-0.8} l22 12.8 22 -12.8" fill="none" stroke="#ffc575" stroke-width=".7"/>`).join("") : ""}
      </g>` : ""}
    </g>`;
  }).map((markup,index)=>({markup,y:locations[index][1]})).sort((a,b)=>a.y-b.y).map(tile=>tile.markup).join("");
  return `<div class="board-visual"><svg class="board-svg" viewBox="-8 -20 360 310" xmlns="http://www.w3.org/2000/svg" aria-label="12개 미션 건물이 있는 축제 도시">
    <path d="M0 164L172 264V278L0 178Z" fill="#d8c784"/>
    <path d="M172 264L344 164V178L172 278Z" fill="#b9ac7a"/>
    <path d="M172 64L344 164L172 264L0 164Z" fill="#ffe688"/>
    ${tiles}
  </svg></div>`;
}

function boardCard({ complete = false, interactive = true, title = "나의 축제 도시" } = {}) {
  return `
    <section class="board-card${complete ? " board-card--complete" : ""}">
      <div class="board-heading">
        <div>
          <h2 class="title">${title}</h2>
          <p class="caption">${interactive ? "칸을 눌러 미션 안내를 확인하세요." : "열두 개의 건물이 모두 올라왔어요."}</p>
        </div>
        ${interactive ? badge("12 MISSIONS", "outline") : ""}
      </div>
      <div class="board-viewport">
        ${boardVisual({ complete, interactive })}
      </div>
      ${interactive ? "" : badge("12 / 12 COMPLETE", "dark")}
    </section>
  `;
}

function loginScreen() {
  return `
    <section class="screen login-screen">
      <div class="login-intro">
        ${badge("STUDENT ACCESS", "yellow")}
        <h1 class="display-title">축제 도시로<br />입장해요</h1>
        <p class="body">학번과 학생별 입장코드를 입력해 주세요.</p>
      </div>
      <form class="form login-card" data-form="login" novalidate>
        <label class="field">
          <span class="field-label">학번</span>
          <input name="studentId" inputmode="numeric" autocomplete="username" placeholder="예: 27101" aria-invalid="${state.loginError}" />
        </label>
        <label class="field">
          <span class="field-label">입장코드</span>
          <input name="entryCode" autocomplete="current-password" placeholder="입장코드를 입력하세요" aria-invalid="${state.loginError}" />
        </label>
        ${state.loginError ? `<p class="form-error">학번과 입장코드를 모두 입력해 주세요.</p>` : ""}
        <button class="button" type="submit">로그인</button>
      </form>
    </section>
  `;
}

function scoreMissionBody(mission, completed) {
  return `<button class="button button--secondary" type="button" data-action="close-mission">닫기</button>`;
}

function findMissionBody(mission, completed) {
  return completed
    ? `<button class="button button--secondary" type="button" data-action="close-mission">닫기</button>`
    : `<button class="button" type="button" data-action="start-nfc" data-mission-id="${mission.id}">NFC 태깅</button>`;
}

function codeMissionBody(mission, completed) {
  if (completed) return `<button class="button button--secondary" type="button" data-action="close-mission">닫기</button>`;
  return `<form class="code-form" data-form="code">
    <label class="field">
      <span class="field-label">공연 코드</span>
      <input name="missionCode" autocomplete="off" placeholder="코드 입력" aria-invalid="${state.codeError}" />
    </label>
    ${state.codeError ? '<p class="form-error">코드를 입력해 주세요.</p>' : ""}
    <button class="button" type="submit">코드 확인</button>
  </form>`;
}

function footer() {
  return `<footer class="site-footer">
    <p>제작 | 상산고등학교 학생회 문화기획부</p>
    <button type="button" data-action="logout">로그아웃</button>
  </footer>`;
}

function missionModal() {
  const mission = getMission(state.selectedMissionId);
  if (!mission) return "";

  const completed = state.completedIds.has(mission.id);
  const body =
    mission.type === "score"
      ? scoreMissionBody(mission, completed)
      : mission.type === "code"
        ? codeMissionBody(mission, completed)
        : findMissionBody(mission, completed);

  return `
    <div class="modal-backdrop" data-action="dismiss-modal">
      <section class="mission-modal" role="dialog" aria-modal="true" aria-labelledby="mission-title">
        <div class="modal-topline">
          <span class="sheet-handle" aria-hidden="true"></span>
          <button class="icon-button" type="button" data-action="close-mission" aria-label="미션 안내 닫기">×</button>
        </div>
        <div class="mission-title-row">
          <div>
            <p class="eyebrow">${mission.label}</p>
            <h2 class="title" id="mission-title">${mission.title}</h2>
          </div>
          ${badge(completed ? "완료" : "미완료", completed ? "find" : "soft")}
        </div>
        ${body}
      </section>
    </div>
  `;
}

function boardScreen() {
  const updatedMission = state.lastCompletedId ? getMission(state.lastCompletedId) : null;
  return `
    <section class="screen board-screen">
      ${header()}
      ${stats()}
      ${
        updatedMission
          ? `<div class="update-banner"><span class="update-check">✓</span><span>MISSION ${missionNumber(updatedMission.id)} 완료 · 건물이 올라왔어요</span></div>`
          : ""
      }
      ${boardCard()}
      ${footer()}
      ${missionModal()}
    </section>
  `;
}

function processingScreen() {
  const mission = getMission(state.pendingMissionId);
  const isCode = state.pendingMode === "code";
  return `
    <section class="screen">
      ${header({ eyebrow: `MISSION ${missionNumber(mission.id)}`, title: isCode ? "코드 확인" : "NFC 태깅" })}
      <section class="feedback-card">
        <img class="status-icon" src="${icons.processing}" alt="확인 중" />
        <h1 class="title">${isCode ? "코드를 확인하고 있어요" : "태그를 확인하고 있어요"}</h1>
        <p class="body">잠시만 기다려 주세요.</p>
        <div class="loading-track" aria-hidden="true"><span></span></div>
        <div class="button is-disabled" aria-disabled="true"><span class="loading-dots">처리 중</span></div>
      </section>
    </section>
  `;
}

function successScreen() {
  const mission = getMission(state.lastCompletedId || state.pendingMissionId);
  return `
    <section class="screen">
      ${header({ eyebrow: `MISSION ${missionNumber(mission.id)}`, title: "미션 완료" })}
      <section class="feedback-card feedback-card--success">
        <img class="status-icon" src="${icons.success}" alt="완료" />
        <div class="success-building" aria-hidden="true"><span></span></div>
        <h1 class="title">MISSION ${missionNumber(mission.id)} 완료!</h1>
        <p class="body">건물이 한 단계 올라갔어요.</p>
        <button class="button" type="button" data-action="return-board">게임판에서 확인하기</button>
      </section>
    </section>
  `;
}

function completeScreen() {
  const totalScore = missionDefinitions.reduce((sum, mission) => sum + (mission.score || 0), 0);
  return `
    <section class="screen complete-screen">
      ${badge("12 / 12 COMPLETE", "dark")}
      <h1 class="display-title">모든 미션을<br />완료했어요</h1>
      <p class="body">열두 개의 건물이 모두 올라왔습니다. 최종 결과를 확인해 주세요.</p>
      <section class="score-card">
        <p class="stat-label">최종 점수</p>
        <p class="score-value">${totalScore}점</p>
      </section>
      ${boardCard({ complete: true, interactive: false, title: "완성된 나의 축제 도시" })}
      ${footer()}
    </section>
  `;
}

function render() {
  const screens = {
    login: loginScreen,
    board: boardScreen,
    processing: processingScreen,
    success: successScreen,
    complete: completeScreen,
  };

  app.innerHTML = screens[state.view]();
  app.scrollTop = 0;
  bindScreenEvents();
}

function completePendingMission() {
  const missionId = state.pendingMissionId;
  state.completedIds.add(missionId);
  state.lastCompletedId = missionId;
  state.animateMissionId = missionId;
  state.view = "success";
  render();
}

function startProcessing(missionId, mode = "nfc") {
  state.pendingMissionId = Number(missionId);
  state.pendingMode = mode;
  state.selectedMissionId = null;
  state.codeError = false;
  state.view = "processing";
  render();

  window.setTimeout(() => {
    if (state.view === "processing" && state.pendingMissionId === Number(missionId)) {
      completePendingMission();
    }
  }, 1450);
}

function bindScreenEvents() {
  app.querySelector('[data-action="logout"]')?.addEventListener("click", resetDemo);
  const loginForm = app.querySelector('[data-form="login"]');
  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(loginForm);
    const hasStudentId = String(data.get("studentId") || "").trim().length > 0;
    const hasEntryCode = String(data.get("entryCode") || "").trim().length > 0;

    if (!hasStudentId || !hasEntryCode) {
      state.loginError = true;
      render();
      return;
    }

    state.loginError = false;
    state.view = "board";
    render();
  });

  app.querySelectorAll('[data-action="select-mission"]').forEach((button) => {
    button.addEventListener("click", () => {
      state.animateMissionId = null;
      state.selectedMissionId = Number(button.dataset.missionId);
      state.codeError = false;
      render();
    });
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
    });
  });

  app.querySelector('[data-action="start-nfc"]')?.addEventListener("click", (event) => {
    startProcessing(event.currentTarget.dataset.missionId, "nfc");
  });

  const codeForm = app.querySelector('[data-form="code"]');
  codeForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = String(new FormData(codeForm).get("missionCode") || "").trim();
    if (!code) {
      state.codeError = true;
      render();
      return;
    }
    startProcessing(state.selectedMissionId, "code");
  });

  app.querySelectorAll('[data-action="close-mission"]').forEach((button) => button.addEventListener("click", () => {
    state.selectedMissionId = null;
    state.codeError = false;
    render();
  }));

  app.querySelector('[data-action="dismiss-modal"]')?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) {
      state.selectedMissionId = null;
      state.codeError = false;
      render();
    }
  });

  app.querySelector('[data-action="return-board"]')?.addEventListener("click", () => {
    state.pendingMissionId = null;
    state.view = "board";
    render();
  });
}

function resetDemo() {
  state.view = "login";
  state.selectedMissionId = null;
  state.pendingMissionId = null;
  state.pendingMode = "nfc";
  state.completedIds = new Set();
  state.loginError = false;
  state.lastCompletedId = null;
  state.animateMissionId = null;
  state.codeError = false;
  render();
}

render();
