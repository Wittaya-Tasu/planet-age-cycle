import { loadAppData } from "./data/loadData.js";
import {
  calculateCalendarAge,
  compareCivilDates,
  currentBangkokDate,
  datePartsToEpoch,
  formatAge,
  formatThaiDate,
  formatThaiDateShortFromEpoch,
  gregorianToBuddhist,
  targetDateToEpoch,
  validateCivilDate,
} from "./core/calendar.js";
import { calculateChulasakarat } from "./core/thaiCalendar.js";
import { calculateMahabhutaMap } from "./core/mahabhuta.js";
import { findCurrentPeriod, validateCycle } from "./core/mahadasha.js";
import { buildAnnualForecast } from "./core/annualForecast.js";
import { renderKalayokTable } from "./components/kalayok-table.js";
import { renderCurrentSummary } from "./components/summary.js";
import { renderWheel } from "./components/wheel.js";
import { renderTimeline } from "./components/timeline.js";
import { renderSubperiodExplorer } from "./components/subperiod-explorer.js";
import { renderAnnualForecast } from "./components/annual-view.js";
import { saveVisualizationImage } from "./core/exportImage.js";

const STORAGE_KEY = "maha-thasa-profile-v0.9.3";
const MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const BIRTH_DAY_META = {
  sunday: { label: "อาทิตย์", weekday: 0 },
  monday: { label: "จันทร์", weekday: 1 },
  tuesday: { label: "อังคาร", weekday: 2 },
  "wednesday-day": { label: "พุธกลางวัน", weekday: 3 },
  "wednesday-night": { label: "พุธกลางคืน", weekday: 3 },
  thursday: { label: "พฤหัสบดี", weekday: 4 },
  friday: { label: "ศุกร์", weekday: 5 },
  saturday: { label: "เสาร์", weekday: 6 },
};

const form = document.querySelector("#birth-form");
const onboarding = document.querySelector("#onboarding");
const dashboard = document.querySelector("#dashboard");
const birthDayType = document.querySelector("#birth-day-type");
const birthDay = document.querySelector("#birth-date-day");
const birthMonth = document.querySelector("#birth-date-month");
const birthYear = document.querySelector("#birth-date-year");
const birthTime = document.querySelector("#birth-time");
const birthTimeUnknown = document.querySelector("#birth-time-unknown");
const targetDateDay = document.querySelector("#target-date-day");
const targetDateMonth = document.querySelector("#target-date-month");
const targetDateYear = document.querySelector("#target-date-year");
const formError = document.querySelector("#form-error");
const todayButton = document.querySelector("#today-button");
const currentSummary = document.querySelector("#current-summary");
const kalayokTable = document.querySelector("#kalayok-table");
const wheelContainer = document.querySelector("#wheel-container");
const timelineContainer = document.querySelector("#timeline-container");
const wheelStage = document.querySelector("#wheel-stage");
const timelineStage = document.querySelector("#timeline-stage");
const subExplorer = document.querySelector("#subperiod-explorer");
const viewWheel = document.querySelector("#view-wheel");
const viewTimeline = document.querySelector("#view-timeline");
const profileBirth = document.querySelector("#profile-birth");
const profileTarget = document.querySelector("#profile-target");
const editButton = document.querySelector("#edit-button");
const resetButton = document.querySelector("#reset-button");
const saveImageButton = document.querySelector("#save-image-button");
const fatalError = document.querySelector("#fatal-error");
const installButton = document.querySelector("#install-button");
const pageTabMahadasha = document.querySelector("#page-tab-mahadasha");
const pageTabAnnual = document.querySelector("#page-tab-annual");
const mahadashaPage = document.querySelector("#mahadasha-page");
const annualPage = document.querySelector("#annual-page");
const annualAgeBasis = document.querySelector("#annual-age-basis");
const annualTitle = document.querySelector("#annual-title");
const annualRange = document.querySelector("#annual-range");
const annualVisualContainer = document.querySelector("#annual-visual-container");

let datasets;
let currentState = null;
let currentMode = "wheel";
let currentResultPage = "mahadasha";
let selectedMainPlanet = null;
let deferredInstallPrompt = null;
let annualModel = null;

function planetsByNumber() {
  return Object.fromEntries(datasets.planets.planets.map((planet) => [planet.number, planet]));
}

function setError(message = "") {
  formError.textContent = message;
  formError.hidden = !message;
}

function writeTargetDate(date) {
  targetDateDay.value = String(date.day);
  targetDateMonth.value = String(date.month);
  targetDateYear.value = String(date.yearBe);
}

function readTargetDate() {
  return {
    yearBe: Number(targetDateYear.value),
    month: Number(targetDateMonth.value),
    day: Number(targetDateDay.value),
  };
}

function parseTime(value) {
  if (!value) return null;
  const [hour, minute] = value.split(":").map(Number);
  return { hour, minute };
}

function formatTime(time) {
  return time ? `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")} น.` : "ไม่ทราบเวลา";
}

function readProfile() {
  const birthDateValue = {
    yearBe: Number(birthYear.value),
    month: Number(birthMonth.value),
    day: Number(birthDay.value),
  };
  if (!validateCivilDate(birthDateValue)) throw new Error("วัน เดือน หรือปีเกิดไม่ถูกต้อง");
  const target = readTargetDate();
  if (!validateCivilDate(target)) throw new Error("กรุณาระบุวันที่ต้องการคำนวณอายุให้ถูกต้อง");
  if (compareCivilDates(target, birthDateValue) < 0) throw new Error("วันที่คำนวณอายุต้องไม่อยู่ก่อนวันเกิด");
  const time = birthTimeUnknown.checked ? null : parseTime(birthTime.value);
  return { birthDayType: birthDayType.value, birthDate: birthDateValue, birthTime: time, targetDate: target };
}

function writeProfile(profile) {
  birthDayType.value = profile.birthDayType;
  birthDay.value = profile.birthDate.day;
  birthMonth.value = profile.birthDate.month;
  birthYear.value = profile.birthDate.yearBe;
  birthTimeUnknown.checked = !profile.birthTime;
  birthTime.disabled = !profile.birthTime;
  birthTime.value = profile.birthTime ? `${String(profile.birthTime.hour).padStart(2, "0")}:${String(profile.birthTime.minute).padStart(2, "0")}` : "";
  writeTargetDate(profile.targetDate);
}

function deriveState(profile) {
  const age = calculateCalendarAge(profile.birthDate, profile.targetDate);
  const pMap = planetsByNumber();
  const birthPlanet = datasets.planets.birthDayStartPlanet[profile.birthDayType];
  const chulasakarat = calculateChulasakarat(profile.birthDate, profile.birthTime, datasets.boundaries);
  const kalayokMap = chulasakarat.status === "exact" ? calculateMahabhutaMap(chulasakarat.value, datasets.kalayok) : null;
  const targetEpochMs = targetDateToEpoch(profile.targetDate);
  const current = findCurrentPeriod({
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    startPlanet: birthPlanet,
    targetEpochMs,
    age,
    planetsData: datasets.planets,
  });
  if (!validateCycle(current.cycle)) throw new Error("โครงสร้างดาวแทรกไม่ปิดพอดีกับช่วงดาวเสวยหลัก");
  const birthEpoch = datePartsToEpoch(profile.birthDate, profile.birthTime, 12);
  return { profile, age, birthPlanet, chulasakarat, kalayokMap, current, targetEpochMs, pMap, birthEpoch };
}

function visualContext() {
  const s = currentState;
  return {
    cycle: s.current.cycle,
    current: s.current,
    planetsByNumber: s.pMap,
    birthPlanet: s.birthPlanet,
    kalayokMap: s.kalayokMap,
    relationshipsData: datasets.relationships,
    age: s.age,
    targetEpochMs: s.targetEpochMs,
  };
}

function selectedMainPeriod() {
  return currentState.current.cycle.mainPeriods.find((item) => item.planet === selectedMainPlanet) ?? currentState.current.main;
}

function onMainSelect(main) {
  selectedMainPlanet = main.planet;
  if (currentMode === "timeline") {
    renderTimeline(timelineContainer, visualContext(), { onMainSelect }, selectedMainPlanet);
    subExplorer.hidden = true;
  } else {
    renderSubperiodExplorer(subExplorer, {
      mainPeriod: selectedMainPeriod(),
      planetsByNumber: currentState.pMap,
      birthPlanet: currentState.birthPlanet,
      kalayokMap: currentState.kalayokMap,
      relationshipsData: datasets.relationships,
      birthEpoch: currentState.birthEpoch,
      birthTimeKnown: Boolean(currentState.profile.birthTime),
    });
    subExplorer.hidden = false;
  }
}

function setMode(mode) {
  currentMode = mode === "timeline" ? "timeline" : "wheel";
  const isWheel = currentMode === "wheel";
  wheelStage.hidden = !isWheel;
  timelineStage.hidden = isWheel;
  viewWheel.classList.toggle("is-active", isWheel);
  viewTimeline.classList.toggle("is-active", !isWheel);
  viewWheel.setAttribute("aria-pressed", String(isWheel));
  viewTimeline.setAttribute("aria-pressed", String(!isWheel));
  subExplorer.hidden = !isWheel;
  if (!isWheel && currentState) renderTimeline(timelineContainer, visualContext(), { onMainSelect }, selectedMainPlanet);
  if (isWheel && currentState) onMainSelect(selectedMainPeriod());
}

function renderAnnualPage() {
  if (!currentState) return;
  annualModel = buildAnnualForecast({
    profile: currentState.profile,
    birthPlanet: currentState.birthPlanet,
    natalKalayokMap: currentState.kalayokMap,
    planetsData: datasets.planets,
    kalayokData: datasets.kalayok,
    relationshipsData: datasets.relationships,
    boundariesConfig: datasets.boundaries,
    annualConfig: datasets.annualForecast,
    ageBasis: annualAgeBasis.value,
  });
  const ageBasisLabel = annualModel.ageBasis === "yang_age" ? "อายุย่าง" : "อายุเต็ม";
  annualTitle.textContent = `ผลประจำปี · ${ageBasisLabel} ${annualModel.calculationAge} ปี`;
  annualRange.textContent = `${formatThaiDateShortFromEpoch(annualModel.yearStartEpochMs, false)} → ก่อน ${formatThaiDateShortFromEpoch(annualModel.yearEndEpochMs, false)} · ใช้อายุคำนวณ ${ageBasisLabel} ${annualModel.calculationAge} ปี · ภูมิ ${annualModel.phumi.thaksaPosition.nameTh}`;
  renderAnnualForecast(annualVisualContainer, annualModel, currentState.pMap);
}

function setResultPage(page) {
  currentResultPage = page === "annual" ? "annual" : "mahadasha";
  const annual = currentResultPage === "annual";
  mahadashaPage.hidden = annual;
  annualPage.hidden = !annual;
  pageTabMahadasha.classList.toggle("is-active", !annual);
  pageTabAnnual.classList.toggle("is-active", annual);
  pageTabMahadasha.setAttribute("aria-pressed", String(!annual));
  pageTabAnnual.setAttribute("aria-pressed", String(annual));
  if (annual) renderAnnualPage();
}

function renderDashboard(profile) {
  currentState = deriveState(profile);
  selectedMainPlanet = currentState.current.main.planet;
  onboarding.hidden = true;
  dashboard.hidden = false;

  const timeText = formatTime(profile.birthTime);
  profileBirth.textContent = `เกิดวัน${BIRTH_DAY_META[profile.birthDayType].label} · ${formatThaiDate(profile.birthDate)} · ${timeText}`;
  profileTarget.textContent = `คำนวณถึง ${formatThaiDate(profile.targetDate)} · อายุ ${formatAge(currentState.age)}`;

  renderCurrentSummary(currentSummary, {
    age: currentState.age,
    current: currentState.current,
    planetsByNumber: currentState.pMap,
    chulasakaratResult: currentState.chulasakarat,
    birthTimeKnown: Boolean(profile.birthTime),
  });
  renderKalayokTable(kalayokTable, {
    chulasakaratResult: currentState.chulasakarat,
    kalayokMap: currentState.kalayokMap,
    birthPlanet: currentState.birthPlanet,
  });
  renderWheel(wheelContainer, visualContext(), { onMainSelect });
  renderTimeline(timelineContainer, visualContext(), { onMainSelect }, selectedMainPlanet);
  onMainSelect(selectedMainPeriod());
  setMode(currentMode);
  annualAgeBasis.value = datasets.annualForecast.defaultAgeBasis;
  renderAnnualPage();
  setResultPage(currentResultPage);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function initializeForm() {
  birthMonth.replaceChildren(...MONTHS.map((name, index) => {
    const option = document.createElement("option");
    option.value = String(index + 1);
    option.textContent = name;
    return option;
  }));
  const today = currentBangkokDate();
  targetDateMonth.replaceChildren(...MONTHS.map((name, index) => {
    const option = document.createElement("option");
    option.value = String(index + 1);
    option.textContent = name;
    return option;
  }));
  writeTargetDate(today);
  birthTime.value = "07:00";
  birthYear.value = String(today.yearBe - 30);
  birthMonth.value = "1";
  birthDay.value = "1";
}

birthTimeUnknown.addEventListener("change", () => {
  birthTime.disabled = birthTimeUnknown.checked;
  if (birthTimeUnknown.checked) birthTime.value = "";
});

todayButton.addEventListener("click", () => { writeTargetDate(currentBangkokDate()); });

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const profile = readProfile();
    setError();
    currentResultPage = "mahadasha";
    renderDashboard(profile);
  } catch (error) {
    setError(error instanceof Error ? error.message : String(error));
  }
});

editButton.addEventListener("click", () => {
  if (currentState) writeProfile(currentState.profile);
  dashboard.hidden = true;
  onboarding.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

resetButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  currentState = null;
  annualModel = null;
  currentResultPage = "mahadasha";
  dashboard.hidden = true;
  onboarding.hidden = false;
  initializeForm();
  setError();
});

viewWheel.addEventListener("click", () => setMode("wheel"));
viewTimeline.addEventListener("click", () => setMode("timeline"));
pageTabMahadasha.addEventListener("click", () => setResultPage("mahadasha"));
pageTabAnnual.addEventListener("click", () => setResultPage("annual"));
annualAgeBasis.addEventListener("change", () => {
  try {
    renderAnnualPage();
  } catch (error) {
    annualAgeBasis.value = "yang_age";
    renderAnnualPage();
    alert(error instanceof Error ? error.message : String(error));
  }
});

saveImageButton.addEventListener("click", async () => {
  if (!currentState) return;
  const old = saveImageButton.textContent;
  saveImageButton.disabled = true;
  saveImageButton.textContent = "กำลังสร้างภาพ…";
  try {
    if (currentResultPage === "annual") {
      const summary = `อายุเต็ม ${annualModel.completedAgeYears} ปี · อายุย่าง ${annualModel.ageYang} · ภูมิ ${annualModel.phumi.thaksaPosition.nameTh}`;
      await saveVisualizationImage({
        visualizationContainer: annualVisualContainer,
        supplementaryContainer: null,
        mode: "annual",
        profileText: profileBirth.textContent,
        summaryText: summary,
      });
    } else {
      const container = currentMode === "wheel" ? wheelContainer : timelineContainer;
      const summary = `${currentState.pMap[currentState.current.main.planet].shortNameTh}เสวย · ${currentState.pMap[currentState.current.sub.subPlanet].shortNameTh}แทรก · อายุ ${formatAge(currentState.age)}`;
      await saveVisualizationImage({
        visualizationContainer: container,
        supplementaryContainer: currentMode === "wheel" ? subExplorer : null,
        mode: currentMode,
        profileText: profileBirth.textContent,
        summaryText: summary,
      });
    }
  } catch (error) {
    alert(error instanceof Error ? error.message : String(error));
  } finally {
    saveImageButton.disabled = false;
    saveImageButton.textContent = old;
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

async function init() {
  try {
    initializeForm();
    datasets = await loadAppData("./data");
    annualAgeBasis.value = datasets.annualForecast.defaultAgeBasis;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        writeProfile(profile);
        renderDashboard(profile);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(console.warn));
  } catch (error) {
    fatalError.hidden = false;
    fatalError.textContent = `ไม่สามารถเริ่มระบบได้: ${error instanceof Error ? error.message : String(error)}`;
  }
}

init();
