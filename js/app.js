import { buildWheelModel } from "./core/angles.js";
import { calculateCalendarAge, createCivilDate } from "./core/age.js";
import {
  bangkokPartsToEpochMs,
  buddhistToGregorian,
  calendarDifference,
  formatThaiDateTime,
} from "./core/calendar.js";
import { createCalendarJourneyState } from "./core/calendarJourney.js";
import { findCurrentPeriod } from "./core/periodCalculator.js";
import { getPrediction } from "./core/predictionLookup.js";
import { saveDashboardImage } from "./core/exportImage.js";
import { decoratePeriodRelations } from "./core/relations.js";
import { loadPlanetAgeData } from "./data/loadData.js";
import { initializeBirthForm, readProfileForm, resetBirthForm, setTargetToToday, writeProfileForm } from "./components/birth-form.js";
import { renderDetailPanel } from "./components/detail-panel.js";
import { renderJourneySummary } from "./components/journey-summary.js";
import { renderLegend } from "./components/legend.js";
import { renderTimeline } from "./components/timeline.js";
import { createTooltipController } from "./components/tooltip.js";
import { renderWheel } from "./components/wheel.js";
import { getBirthDay } from "./data/birth-days.js";
import { formatCalendarAge, formatThaiDate } from "./utils/format.js";
import { validateWheelModel } from "./utils/validation.js";

const STORAGE_KEY = "planet-age-cycle-profile-v2";
const onboarding = document.querySelector("#onboarding");
const appContent = document.querySelector("#app-content");
const profileBar = document.querySelector("#profile-bar");
const profileBirth = document.querySelector("#profile-birth");
const profileTarget = document.querySelector("#profile-target");
const birthForm = document.querySelector("#birth-form");
const birthFormTitle = document.querySelector("#birth-form-title");
const formError = document.querySelector("#form-error");
const leapDayNotice = document.querySelector("#leap-day-form-notice");
const cancelEditButton = document.querySelector("#cancel-edit-button");
const saveImageButton = document.querySelector("#save-image-button");
const editProfileButton = document.querySelector("#edit-profile-button");
const resetButton = document.querySelector("#reset-button");
const todayButton = document.querySelector("#today-button");
const supportButton = document.querySelector("#support-button");
const supportingInfo = document.querySelector("#supporting-info");
const wheelContainer = document.querySelector("#wheel-container");
const timelineContainer = document.querySelector("#timeline-container");
const wheelStage = document.querySelector("#wheel-stage");
const timelineStage = document.querySelector("#timeline-stage");
const wheelViewButton = document.querySelector("#view-wheel-button");
const timelineViewButton = document.querySelector("#view-timeline-button");
const detailPanel = document.querySelector("#detail-panel");
const journeySummary = document.querySelector("#journey-summary");
const legendContainer = document.querySelector("#legend");
const tooltipElement = document.querySelector("#tooltip");
const errorBanner = document.querySelector("#validation-error");
const installButton = document.querySelector("#install-button");

let model;
let datasets;
let tooltip;
let wheelController;
let timelineController;
let currentProfile = null;
let currentJourney = null;
let currentPeriodResult = null;
let selectedSegment = null;
let deferredInstallPrompt = null;
let currentView = "wheel";

function toCalculationProfile(profile) {
  return {
    birthDayType: profile.birthWeekday,
    birth: {
      yearBE: profile.birthDate.yearBe,
      month: profile.birthDate.month,
      day: profile.birthDate.day,
      hour: profile.birthTime?.hour ?? 0,
      minute: profile.birthTime?.minute ?? 0,
    },
  };
}

function targetEpoch(profile) {
  return bangkokPartsToEpochMs({
    year: buddhistToGregorian(profile.targetDate.yearBe),
    month: profile.targetDate.month,
    day: profile.targetDate.day,
    hour: profile.targetTime?.hour ?? 12,
    minute: profile.targetTime?.minute ?? 0,
  });
}

function showValidationError(errors) {
  errorBanner.textContent = `ไม่สามารถเริ่มระบบได้: ${errors.join(" · ")}`;
  errorBanner.hidden = false;
  console.error("[Planet Age Cycle Validation]", errors);
}

function setFormError(message = "") {
  formError.textContent = message;
  formError.hidden = !message;
}

function updateLegendPressedState() {
  document.querySelectorAll(".legend-item").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.segmentKey === selectedSegment?.key));
  });
}

function periodForSegment(segment) {
  if (!currentPeriodResult || segment.type !== "sub") return null;
  return currentPeriodResult.cycle.mainPeriods
    .flatMap((main) => main.subperiods)
    .find((period) => period.mainPlanet === segment.mainNumber && period.subPlanet === segment.subNumber) ?? null;
}

function selectSegment(segment) {
  if (!currentJourney) return;
  selectedSegment = segment ?? currentJourney.activeSub;
  wheelController?.setSelected(selectedSegment);
  timelineController?.setSelected(selectedSegment);
  const period = periodForSegment(selectedSegment);
  const isCurrent =
    selectedSegment.key === currentJourney.activeSub.key;
  const prediction = selectedSegment.type === "sub"
    ? getPrediction(datasets.predictionsData, selectedSegment.mainNumber, selectedSegment.subNumber)
    : null;
  const relations = selectedSegment.type === "sub" && period
    ? decoratePeriodRelations(datasets.relationsData, currentProfile.birthWeekday, period)
    : null;

  const progress =
    isCurrent && period
      ? {
          fraction: currentJourney.subProgress,
          elapsed: calendarDifference(
            period.startEpochMs,
            currentJourney.targetEpochMs,
          ),
          remaining: calendarDifference(
            currentJourney.targetEpochMs,
            period.endEpochMs,
          ),
        }
      : null;

  renderDetailPanel(detailPanel, selectedSegment, {
    isCurrent,
    period,
    progress,
    prediction,
    mainRelation: relations?.mainRelation,
    subRelation: relations?.subRelation,
    uiText: datasets.uiText,
  });
  updateLegendPressedState();
  tooltip.hide();
}

function hideSupportingInfo() {
  supportingInfo.hidden = true;
  supportButton.setAttribute("aria-expanded", "false");
  supportButton.textContent = "ข้อมูลประกอบ";
}

function setVisualizationMode(mode) {
  currentView = mode === "timeline" ? "timeline" : "wheel";
  const isWheel = currentView === "wheel";
  wheelStage.hidden = !isWheel;
  timelineStage.hidden = isWheel;
  wheelViewButton?.setAttribute("aria-pressed", String(isWheel));
  timelineViewButton?.setAttribute("aria-pressed", String(!isWheel));
  wheelViewButton?.classList.toggle("is-active", isWheel);
  timelineViewButton?.classList.toggle("is-active", !isWheel);

  if (!isWheel) {
    window.requestAnimationFrame(() => timelineController?.scrollToCurrent());
  }
}

function showInitialScreen() {
  currentProfile = null;
  currentJourney = null;
  currentPeriodResult = null;
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
  wheelContainer.replaceChildren();
  timelineContainer.replaceChildren();
}

function renderProfile(profile) {
  const birthDay = getBirthDay(profile.birthWeekday);
  const birthDate = createCivilDate(profile.birthDate);
  const targetDate = createCivilDate(profile.targetDate);
  const age = calculateCalendarAge(birthDate, targetDate);
  const targetMs = targetEpoch(profile);
  const calculationProfile = toCalculationProfile(profile);
  const periodResult = findCurrentPeriod(
    calculationProfile,
    targetMs,
    datasets,
  );

  const profileModel = buildWheelModel(
    birthDay.planetNumber,
  );
  const profileValidation = validateWheelModel(
    profileModel,
  );
  if (!profileValidation.valid) {
    throw new Error(
      profileValidation.errors.join(" · "),
    );
  }

  model = profileModel;
  const journey = createCalendarJourneyState(
    model,
    birthDay,
    periodResult,
    targetMs,
  );

  currentProfile = profile;
  currentJourney = journey;
  currentPeriodResult = periodResult;
  onboarding.hidden = true;
  appContent.hidden = false;
  profileBar.hidden = false;
  supportButton.hidden = false;
  profileBirth.textContent = `วัน${birthDay.label} · ${formatThaiDate(profile.birthDate)} · ${String(profile.birthTime.hour).padStart(2, "0")}:${String(profile.birthTime.minute).padStart(2, "0")} น.`;
  profileTarget.textContent = `${formatThaiDateTime(targetMs)} · อายุ ${formatCalendarAge(age)}`;

  renderLegend(
    legendContainer,
    model.mainSegments,
    selectSegment,
  );

  const interactionHandlers = {
    onSelect: selectSegment,
    onPreview: (segment, source) => tooltip.show(segment, source),
    onPointerMove: (event) => tooltip.move(event),
    onPreviewEnd: () => tooltip.hide(),
  };
  const interactionContext = {
    age: periodResult.currentAge,
    birthDay,
    journey,
    relationsData: datasets.relationsData,
    birthDayType: currentProfile.birthWeekday,
  };

  wheelController = renderWheel(
    wheelContainer,
    model,
    interactionHandlers,
    interactionContext,
  );
  timelineController = renderTimeline(
    timelineContainer,
    model,
    interactionHandlers,
    interactionContext,
  );

  renderJourneySummary(journeySummary, journey);
  selectSegment(journey.activeSub);
  hideSupportingInfo();
  setVisualizationMode(currentView);
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
  if (!currentProfile) return showInitialScreen();
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
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const profile = JSON.parse(raw);
    if (!profile.birthTime) profile.birthTime = { hour: 0, minute: 0 };
    if (!profile.targetTime) profile.targetTime = { hour: 12, minute: 0 };
    return profile;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

async function initializeApp() {
  try {
    [datasets, model] = await Promise.all([loadPlanetAgeData("./data"), Promise.resolve(buildWheelModel())]);
    const validation = validateWheelModel(model);
    if (!validation.valid) return showValidationError(validation.errors);
    tooltip = createTooltipController(tooltipElement);
    initializeBirthForm(birthForm);
    renderLegend(legendContainer, model.mainSegments, selectSegment);
    setVisualizationMode(currentView);
    const saved = loadSavedProfile();
    saved ? renderProfile(saved) : showInitialScreen();
  } catch (error) {
    showValidationError([error instanceof Error ? error.message : String(error)]);
  }
}

birthForm.addEventListener("change", () => {
  const isLeapBirth = Number(birthForm.elements.birthDay.value) === 29 && Number(birthForm.elements.birthMonth.value) === 2;
  leapDayNotice.hidden = !isLeapBirth;
});

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

todayButton.addEventListener("click", () => setTargetToToday(birthForm));
saveImageButton.addEventListener("click", async () => {
  if (!currentProfile || !currentJourney) return;

  const originalText = saveImageButton.textContent;
  saveImageButton.disabled = true;
  saveImageButton.textContent = "กำลังสร้างภาพ…";

  try {
    await saveDashboardImage({
      visualizationContainer: currentView === "timeline" ? timelineContainer : wheelContainer,
      visualizationMode: currentView,
      journeySummary,
      detailPanel,
      profileBirthText: profileBirth.textContent,
      profileTargetText: profileTarget.textContent,
    });
  } catch (error) {
    console.error("[Save Dashboard Image]", error);
    window.alert(error instanceof Error ? error.message : "ไม่สามารถบันทึกภาพได้");
  } finally {
    saveImageButton.disabled = false;
    saveImageButton.textContent = originalText;
  }
});
editProfileButton.addEventListener("click", showEditScreen);
cancelEditButton.addEventListener("click", cancelEdit);
resetButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  wheelContainer.replaceChildren();
  timelineContainer.replaceChildren();
  detailPanel.replaceChildren();
  journeySummary.replaceChildren();
  showInitialScreen();
  onboarding.scrollIntoView({ block: "start" });
});
supportButton.addEventListener("click", () => {
  const open = supportingInfo.hidden;
  supportingInfo.hidden = !open;
  supportButton.setAttribute("aria-expanded", String(open));
  supportButton.textContent = open ? "ซ่อนข้อมูลประกอบ" : "ข้อมูลประกอบ";
});

wheelViewButton?.addEventListener("click", () => setVisualizationMode("wheel"));
timelineViewButton?.addEventListener("click", () => setVisualizationMode("timeline"));

document.addEventListener("click", (event) => {
  if (!currentJourney || !selectedSegment) return;
  const target = event.target.closest(".wheel-segment, .timeline-segment, .legend-item, .detail-card, .journey-summary, button, input, select");
  if (!target) selectSegment(currentJourney.activeSub);
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
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(console.warn));
}

initializeApp();
