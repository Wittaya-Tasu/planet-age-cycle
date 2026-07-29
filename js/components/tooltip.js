import {
  formatAngle,
  formatDuration,
  formatMainDuration,
  getSegmentTitle,
} from "../utils/format.js";

function setContent(element, segment) {
  const title = document.createElement("strong");
  const detail = document.createElement("span");

  title.textContent = getSegmentTitle(segment);
  detail.textContent =
    segment.type === "main"
      ? `แถบหลัก · ${formatMainDuration(segment.mainPlanet.years)} · ${formatAngle(segment.angle)}`
      : `${formatDuration(segment.duration)} · ${formatAngle(segment.angle)}`;

  element.replaceChildren(title, detail);
}

function positionTooltip(element, x, y) {
  const gap = 14;
  const viewportPadding = 10;

  element.style.left = "0px";
  element.style.top = "0px";
  const rect = element.getBoundingClientRect();
  const left = Math.min(
    Math.max(viewportPadding, x + gap),
    window.innerWidth - rect.width - viewportPadding,
  );
  const topCandidate = y - rect.height - gap;
  const top =
    topCandidate >= viewportPadding
      ? topCandidate
      : Math.min(y + gap, window.innerHeight - rect.height - viewportPadding);

  element.style.left = `${left}px`;
  element.style.top = `${Math.max(viewportPadding, top)}px`;
}

export function createTooltipController(element) {
  return {
    show(segment, source) {
      setContent(element, segment);
      element.hidden = false;

      if (source instanceof PointerEvent || source instanceof MouseEvent) {
        positionTooltip(element, source.clientX, source.clientY);
        return;
      }

      const rect = source.getBoundingClientRect();
      positionTooltip(element, rect.left + rect.width / 2, rect.top);
    },
    move(event) {
      if (!element.hidden) {
        positionTooltip(element, event.clientX, event.clientY);
      }
    },
    hide() {
      element.hidden = true;
    },
  };
}
