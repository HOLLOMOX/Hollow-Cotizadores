"use client";

import { useEffect } from "react";

const INTEGER_FIELDS = new Set([
  "cantidad",
  "vistas",
  "margen",
  "ivaPorcentaje",
  "personasFabricacion",
  "personasInstalacion",
  "horasFabricacionManual",
  "horasInstalacionManual",
  "andamios",
  "numeroDescolgadas",
  "wattsPorLampara",
  "tirasPorM2Normal",
  "tirasPorM2Ultra",
  "tirasPorM2Micro",
]);

const DECIMAL_FIELDS = new Set([
  "anchoM",
  "altoM",
  "separacionLamparasM",
]);

const MONEY_FIELDS = new Set([
  "instalacion",
  "materialExtra",
  "extras",
  "costoCaratulaM2",
]);

const CM_FIELDS = new Set(["cantoCmManual"]);

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replaceAll("-", "")
    .replaceAll("_", "");
}

function getInputKey(input: HTMLInputElement) {
  const candidates = [
    input.name,
    input.id,
    input.getAttribute("aria-label"),
    input.getAttribute("placeholder"),
  ];

  return candidates.map(normalize).find(Boolean) ?? "";
}

function matchesField(inputKey: string, fieldName: string) {
  return inputKey === normalize(fieldName) || inputKey.includes(normalize(fieldName));
}

function isField(inputKey: string, fields: Set<string>) {
  for (const field of fields) {
    if (matchesField(inputKey, field)) return true;
  }

  return false;
}

function applyNumberInputSteps() {
  const inputs = document.querySelectorAll<HTMLInputElement>(
    'input[type="number"]'
  );

  inputs.forEach((input) => {
    const inputKey = getInputKey(input);

    if (isField(inputKey, DECIMAL_FIELDS)) {
      input.step = "0.01";
      input.inputMode = "decimal";
      return;
    }

    if (isField(inputKey, MONEY_FIELDS)) {
      input.step = "1";
      input.inputMode = "decimal";
      return;
    }

    if (isField(inputKey, CM_FIELDS)) {
      input.step = "1";
      input.inputMode = "numeric";
      return;
    }

    if (isField(inputKey, INTEGER_FIELDS)) {
      input.step = "1";
      input.inputMode = "numeric";
      return;
    }

    input.step = "1";
    input.inputMode = "numeric";
  });
}

export default function NumberInputStepFix() {
  useEffect(() => {
    applyNumberInputSteps();

    const observer = new MutationObserver(() => {
      applyNumberInputSteps();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}