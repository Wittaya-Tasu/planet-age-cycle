import { buildWheelModel } from "./core/angles.js";
import {
  calculateCalendarAge,
  createCivilDate,
  createJourneyState,
} from "./core/age.js";
import {
  initializeBirthForm,
  readProfileForm,
  resetBirthForm,
  setTargetToToday,
  writeProfileForm,
} from "./components/birth-form.js";
import { renderDetailPanel } from "./components/detail-panel.js";
import { renderJourneySummary } from "./components/journey-summary.js";
import { renderLegend } from "./components/legend.js";
import { createTooltipController } from "./components/tooltip.js";
import { renderWheel } from "./components/wheel.js";
import { getBirthDay } from "./data/birth-days.js";
import {
  formatCalendarAge,
  formatThaiDate,
} from "./utils/format.js";
import { validateWheelModel } from "./utils/validation.js";

const STORAGE_KEY = "planet-age-cycle-profile-v1";

const onboarding = document.querySelector("#onboarding");
const appContent = document.querySelector("#app-content");
const profileBar = document.querySelector("#profile-bar");
const profileBirth = document.querySelector("#profile-birth");
const profileTarget = document.querySelector("#profile-target");
const birthForm = document.querySelector("#birth-form");
const birthFormTitle = document.querySelector("#birth-form-title");
const formError = document.querySelector("#form-error");
const cancelEditButton = document.querySelector("#cancel-edit-button");
const editProfileButton = document.querySelector("#edit-profile-button");
const resetButton = document.querySelector("#reset-button");
const todayButton = document.querySelector("#today-button");
const supportButton = document.querySelector("#support-button");
const supportingInfo = document.querySelector("#supporting-info");
const wheelContainer = document.querySelector("#wheel-container");
const detailPanel = document.querySelector("#detail-panel");
const journeySummary = document.querySelector("#journey-summary");
const legendContainer = document.querySelector("#legend");
const tooltipElement = document.querySelector("#tooltip");
const errorBanner = document.querySelector("#validation-error");
const installButton = document.querySelector("#install-button");

let model;
let tooltip;
let wheelController;
let currentProfile = null;
let currentJourney = null;
let selectedSegment = null;
let deferredInstallPrompt = null;

function showValidationError(errors) {
  const message = `ไม่สามารถวาดวงแหวนได้: ${errors.join(" · ")}`;
  errorBanner.textContent = message;
  errorBanner.hidden = false;
  console.error("[Planet Age Cycle Validation]", errors);
}

function setFormError(message = "") {
  formError.textContent = message;
  formError.hidden = !message;
}

function updateLegendPressedState() {
  document.querySelectorAll(".legend-item").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.segmentKey === selectedSegment?.key),
    );
  });
}

function selectSegment(segment) {
  if (!wheelController || !currentJourney) return;

  selectedSegment = segment ?? currentJourney.activeSub;
  wheelController.setSelected(selectedSegment);
  renderDetailPanel(detailPanel, selectedSegment, {
    isCurrent: selectedSegment.key === currentJourney.activeSub.key,
  });
  updateLegendPressedState();
  tooltip.hide();
}

function hideSupportingInfo() {
  supportingInfo.hidden = true;
  supportButton.setAttribute("aria-expanded", "false");
  supportButton.textContent = "ข้อมูลประกอบ";
}

function showInitialScreen() {
  currentProfile = null;
  currentJourney = null;
  selectedSegment = null;
  onboarding.hidden = false;
  appContent.hidden = true;
  profileBar.hidden = true;
  supportButton.hidden = true;
  birthFormTitle.textContent = "กรอกข้อมูลวันเกิด";
  cancelEditButton.hidden = true;
  setFormError();
  resetBirthForm(birthForm);
  hideSupportingInfo();
}

function renderProfile(profile) {
  const birthDay = getBirthDay(profile.birthWeekday);
  const birthDate = createCivilDate(profile.birthDate);
  const targetDate = createCivilDate(profile.targetDate);
  const age = calculateCalendarAge(birthDate, targetDate);
  const journey = createJourneyState(model, birthDay, age);

  currentProfile = profile;
  currentJourney = journey;
  onboarding.hidden = true;
  appContent.hidden = false;
  profileBar.hidden = false;
  supportButton.hidden = false;
  profileBirth.textContent =
    `วัน${birthDay.label} · ${formatThaiDate(profile.birthDate)}`;
  profileTarget.textContent =
    `${formatThaiDate(profile.targetDate)} · อายุ ${formatCalendarAge(age)}`;

  wheelController = renderWheel(
    wheelContainer,
    model,
    {
      onSelect: selectSegment,
      onPreview: (segment, source) => tooltip.show(segment, source),
      onPointerMove: (event) => tooltip.move(event),
      onPreviewEnd: () => tooltip.hide(),
    },
    { age, birthDay, journey },
  );

  renderJourneySummary(journeySummary, journey);
  selectSegment(journey.activeSub);
  hideSupportingInfo();
}

function showEditScreen() {
  if (!currentProfile) return;

  writeProfileForm(birthForm, currentProfile);
  birthFormTitle.textContent = "แก้ไขข้อมูลวันเกิด";
  cancelEditButton.hidden = false;
  onboarding.hidden = false;
  appContent.hidden = true;
  profileBar.hidden = true;
  supportButton.hidden = true;
  setFormError();
  onboarding.scrollIntoView({ block: "start" });
}

function cancelEdit() {
  if (!currentProfile) {
    showInitialScreen();
    return;
  }

  onboarding.hidden = true;
  appContent.hidden = false;
  profileBar.hidden = false;
  supportButton.hidden = false;
  setFormError();
}

function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function loadSavedProfile() {
  const rawProfile = localStorage.getItem(STORAGE_KEY);
  if (!rawProfile) return null;

  try {
    const profile = JSON.parse(rawProfile);
    getBirthDay(profile.birthWeekday);
    const birthDate = createCivilDate(profile.birthDate);
    const targetDate = createCivilDate(profile.targetDate);
    calculateCalendarAge(birthDate, targetDate);
    return profile;
  } catch (error) {
    console.warn("ข้อมูลที่บันทึกไว้ไม่สมบูรณ์ จึงกลับสู่หน้าเริ่มต้น", error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function initializeApp() {
  try {
    model = buildWheelModel();
    const validation = validateWheelModel(model);

    if (!validation.valid) {
      showValidationError(validation.errors);
      return;
    }

    console.info("[Planet Age Cycle Validation] ผ่าน", validation.summary);
    tooltip = createTooltipController(tooltipElement);
    initializeBirthForm(birthForm);
    renderLegend(legendContainer, model.mainSegments, selectSegment);

    const savedProfile = loadSavedProfile();
    if (savedProfile) {
      renderProfile(savedProfile);
    } else {
      showInitialScreen();
    }
  } catch (error) {
    showValidationError([error instanceof Error ? error.message : String(error)]);
  }
}

birthForm.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    const profile = readProfileForm(birthForm);
    saveProfile(profile);
    setFormError();
    renderProfile(profile);
    profileBar.scrollIntoView({ block: "start" });
  } catch (error) {
    setFormError(error instanceof Error ? error.message : String(error));
  }
});

todayButton.addEventListener("click", () => {
  setTargetToToday(birthForm);
});

editProfileButton.addEventListener("click", showEditScreen);
cancelEditButton.addEventListener("click", cancelEdit);

resetButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  wheelContainer.replaceChildren();
  detailPanel.replaceChildren();
  journeySummary.replaceChildren();
  showInitialScreen();
  onboarding.scrollIntoView({ block: "start" });
});

supportButton.addEventListener("click", () => {
  const shouldOpen = supportingInfo.hidden;
  supportingInfo.hidden = !shouldOpen;
  supportButton.setAttribute("aria-expanded", String(shouldOpen));
  supportButton.textContent = shouldOpen ? "ซ่อนข้อมูลประกอบ" : "ข้อมูลประกอบ";

  if (shouldOpen) {
    supportingInfo.scrollIntoView({ block: "start" });
  }
});

document.addEventListener("click", (event) => {
  if (!currentJourney || !selectedSegment) return;

  const interactiveTarget = event.target.closest(
    ".wheel-segment, .legend-item, .detail-card, .journey-summary, button, input, select",
  );

  if (!interactiveTarget) {
    selectSegment(currentJourney.activeSub);
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("ลงทะเบียนโหมดออฟไลน์ไม่สำเร็จ", error);
    });
  });
}

initializeApp();
