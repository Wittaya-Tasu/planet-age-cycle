export function createPredictionIndex(predictionsData) {
  return new Map(predictionsData.predictions.map((item) => [item.id, item]));
}

export function getPrediction(predictionsData, mainPlanet, subPlanet) {
  const id = `${mainPlanet}-${subPlanet}`;
  return predictionsData.predictions.find((item) => item.id === id) ?? null;
}

export function buildQuickAnswers(prediction, uiText) {
  if (!prediction || prediction.contentStatus === "missing-source") {
    return [{
      id: "missing",
      questionTh: "ช่วงนี้มีคำพยากรณ์หรือไม่",
      answerTh: uiText.missingPrediction
    }];
  }

  const answers = [
    {
      id: "summary",
      questionTh: "ช่วงนี้มีผลอย่างไร",
      answerTh: prediction.summaryTh
    },
    {
      id: "effect",
      questionTh: "ช่วงนี้ดีหรือไม่ดี",
      answerTh: prediction.effect === "mixed"
        ? "ช่วงนี้มีทั้งด้านดีและด้านที่ควรระวัง"
        : `ช่วงนี้มีสถานะ ${uiText.effect[prediction.effect]}`
    }
  ];

  const details = prediction.details;
  if (details.caution?.length) {
    answers.push({
      id: "caution",
      questionTh: "ช่วงนี้ควรระวังเรื่องใด",
      answerTh: details.caution.join(" ")
    });
  }
  if (details.luck?.length) {
    answers.push({
      id: "luck",
      questionTh: "ช่วงนี้มีโชคลาภหรือไม่",
      answerTh: details.luck.join(" ")
    });
  }
  if (details.luckDirection?.length) {
    answers.push({
      id: "luckDirection",
      questionTh: "โชคลาภมาจากทิศใด",
      answerTh: details.luckDirection.join(" ")
    });
  }
  if (details.remedy?.length) {
    answers.push({
      id: "remedy",
      questionTh: "ตำราระบุการแก้เคล็ดหรือบูชาไว้อย่างไร",
      answerTh: details.remedy.join(" ")
    });
  }
  return answers;
}
