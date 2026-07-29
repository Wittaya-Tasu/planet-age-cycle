import { buildWheelModel } from "./core/angles.js";
import { renderDetailPanel } from "./components/detail-panel.js";
import { renderLegend } from "./components/legend.js";
import { createTooltipController } from "./components/tooltip.js";
import { renderWheel } from "./components/wheel.js";
import { validateWheelModel } from "./utils/validation.js";

const wheelContainer = document.querySelector("#wheel-container");
const detailPanel = document.querySelector("#detail-panel");
const legendContainer = document.querySelector("#legend");
const tooltipElement = document.querySelector("#tooltip");
const errorBanner = document.querySelector("#validation-error");
const installButton = document.querySelector("#install-button");

let selectedSegment = null;
let deferredInstallPrompt = null;

function showValidationError(errors) {
  const message = `ไม่สามารถวาดวงแหวนได้: ${errors.join(" · ")}`;
  errorBanner.textContent = message;
  errorBanner.hidden = false;
  console.error("[Planet Age Cycle Validation]", errors);
}

function initializeApp() {
  try {
    const model = buildWheelModel();
    const validation = validateWheelModel(model);

    if (!validation.valid) {
      showValidationError(validation.errors);
      return;
    }

    console.info("[Planet Age Cycle Validation] ผ่าน", validation.summary);
    const tooltip = createTooltipController(tooltipElement);
    let wheelController;

    const selectSegment = (segment) => {
      selectedSegment =
        selectedSegment?.key === segment.key ? null : segment;
      wheelController.setSelected(selectedSegment);
      renderDetailPanel(detailPanel, selectedSegment);
      tooltip.hide();

      document.querySelectorAll(".legend-item").forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.segmentKey === selectedSegment?.key),
        );
      });
    };

    wheelController = renderWheel(wheelContainer, model, {
      onSelect: selectSegment,
      onPreview: (segment, source) => tooltip.show(segment, source),
      onPointerMove: (event) => tooltip.move(event),
      onPreviewEnd: () => tooltip.hide(),
    });

    renderDetailPanel(detailPanel);
    renderLegend(legendContainer, model.mainSegments, selectSegment);

    document.addEventListener("click", (event) => {
      const interactiveTarget = event.target.closest(
        ".wheel-segment, .legend-item, .detail-card",
      );

      if (!interactiveTarget && selectedSegment) {
        selectedSegment = null;
        wheelController.setSelected(null);
        renderDetailPanel(detailPanel);
        document.querySelectorAll(".legend-item").forEach((button) => {
          button.setAttribute("aria-pressed", "false");
        });
      }
    });
  } catch (error) {
    showValidationError([error instanceof Error ? error.message : String(error)]);
  }
}

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
