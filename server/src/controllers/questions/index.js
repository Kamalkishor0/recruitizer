import { findMultipleChoiceQuestions } from "./multipleChoice.js";
// import { getCodingQuestions } from "./coding.js";
// import { getBehavioralQuestions } from "./behavioral.js";

const loaders = {
  multiple_choice: findMultipleChoiceQuestions,
  // coding: getCodingQuestions,
  // behavioral: getBehavioralQuestions,
};

export async function loadQuestionsForTestType(testType, options = {}) {
  const loader = loaders[testType];
  if (!loader) {
    throw new Error(`Unsupported test type: ${testType}`);
  }

  return loader(options);
}

export function isSupportedTestType(testType) {
  return Boolean(loaders[testType]);
}
