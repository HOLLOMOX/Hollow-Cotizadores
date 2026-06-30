export type MaterialLike = {
  grupo?: string;
  concepto?: string;
  name?: string;
  description?: string;
  sku?: string;
  unidad?: string;
  cantidad?: number;
  costoUnitario?: number;
  total?: number;
  [key: string]: unknown;
};

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function getMaterialText(material: MaterialLike) {
  return normalizeText(
    [
      material.sku,
      material.grupo,
      material.concepto,
      material.name,
      material.description,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getFormText(form: Record<string, unknown>) {
  return normalizeText(
    [
      form.caratula,
      form.tipoCaratula,
      form.materialCaratula,
      form.acabado,
      form.rotulacion,
      form.tipoRotulacion,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function isLonaMaterial(material: MaterialLike) {
  const text = getMaterialText(material);

  return (
    text.includes("LONA") ||
    text.includes("BACK") ||
    text.includes("BACKLIGHT") ||
    text.includes("BACK LIGHT")
  );
}

function isLonaBackImpresa(material: MaterialLike) {
  const text = getMaterialText(material);

  const isLona = isLonaMaterial(material);

  const isPrinted =
    text.includes("IMPRESA") ||
    text.includes("IMPRESION") ||
    text.includes("IMPRESIÓN") ||
    text.includes("PRINT") ||
    text.includes("HP");

  return isLona && isPrinted;
}

function isLonaBlancaParaVinil(material: MaterialLike) {
  const text = getMaterialText(material);

  const isLona = isLonaMaterial(material);

  const isWhite =
    text.includes("BLANCA") ||
    text.includes("BLANCO") ||
    text.includes("SIN IMPRESION") ||
    text.includes("SIN IMPRESIÓN") ||
    text.includes("TRASLUCIDA") ||
    text.includes("TRASLÚCIDA") ||
    text.includes("BACKLIGHT");

  const isPrinted =
    text.includes("IMPRESA") ||
    text.includes("IMPRESION") ||
    text.includes("IMPRESIÓN");

  return isLona && isWhite && !isPrinted;
}

function isVinilDeCorte(material: MaterialLike) {
  const text = getMaterialText(material);

  return (
    text.includes("VINIL DE CORTE") ||
    text.includes("VINIL CORTE") ||
    text.includes("VINIL_CORTE") ||
    text.includes("CORTE COLOR") ||
    text.includes("CORTE")
  );
}

function formUsesVinilDeCorte(form: Record<string, unknown>) {
  const text = getFormText(form);

  return (
    text.includes("LONA") &&
    (text.includes("VINIL DE CORTE") ||
      text.includes("VINIL CORTE") ||
      text.includes("ROTULADA") ||
      text.includes("ROTULADO") ||
      text.includes("CORTE"))
  );
}

function formUsesLonaBackImpresa(form: Record<string, unknown>) {
  const text = getFormText(form);

  const hasLona =
    text.includes("LONA") ||
    text.includes("BACK") ||
    text.includes("BACKLIGHT") ||
    text.includes("BACK LIGHT");

  const hasPrint =
    text.includes("IMPRESA") ||
    text.includes("IMPRESION") ||
    text.includes("IMPRESIÓN");

  const hasCutVinyl =
    text.includes("VINIL DE CORTE") ||
    text.includes("VINIL CORTE") ||
    text.includes("ROTULADA") ||
    text.includes("ROTULADO") ||
    text.includes("CORTE");

  return hasLona && hasPrint && !hasCutVinyl;
}

export function cleanCaratulaDuplicatedMaterials<T extends MaterialLike>(
  form: Record<string, unknown>,
  partidas: T[]
): T[] {
  const usesVinilDeCorte = formUsesVinilDeCorte(form);
  const usesLonaImpresa = formUsesLonaBackImpresa(form);

  return partidas.filter((partida) => {
    if (usesVinilDeCorte) {
      // Lona back con vinil de corte:
      // SÍ conserva lona blanca / lona back sin impresión.
      // SÍ conserva vinil de corte.
      // NO debe cobrar lona back impresa.
      if (isLonaBackImpresa(partida)) {
        return false;
      }

      return true;
    }

    if (usesLonaImpresa) {
      // Lona back impresa:
      // SÍ conserva lona impresa.
      // NO debe cobrar lona blanca adicional.
      // NO debe cobrar vinil de corte.
      if (isLonaBlancaParaVinil(partida)) {
        return false;
      }

      if (isVinilDeCorte(partida)) {
        return false;
      }

      return true;
    }

    return true;
  });
}