/**
 * Ontario Rx label parser — rules-based, offline.
 *
 * Classifies each accumulated OCR line against the standard Ontario dispensing
 * label structure (O. Reg. 551 / Drug and Pharmacies Regulation Act) and
 * returns the drug name, dosage, and raw SIG text, together with the raw
 * hit-count for the drug-name item so the caller can gate navigation on it.
 *
 * Expected input: visibleItems sorted top-to-bottom (cy asc) then left-to-right
 * (cx asc), as ScanView already produces for its render list.
 */

// Auto-navigation fires in ScanView when the drug-name item reaches this score.
// Steady-state max with DECAY_FACTOR=0.8 and a +1 boost per cycle is ~5 hits,
// so 4.0 requires ~10 seconds of consistent detection — a useful confidence bar.
export const DRUG_NAME_THRESHOLD = 4.0;

// ─── skip-list patterns ──────────────────────────────────────────────────────
// Patterns with /i are case-insensitive; others rely on Ontario labels being
// printed in uppercase or match structural characters (digits, punctuation) only.
const SKIP = [
  /\d{3}[-.\s]\d{3}[-.\s]\d{4}/,                           // phone number
  /[A-Z]\d[A-Z]\s*\d[A-Z]\d/,                              // Canadian postal code
  /\bRX\s*#?\s*\d{4,8}\b/i,                                // Rx# label
  /^\d{6,8}$/,                                              // bare Rx number
  /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/i, // date with month
  /^[A-Z]{2,},\s+[A-Z]/,                                   // patient name: LAST, FIRST
  /^DR\.?\s+/i,                                             // prescriber (Dr.)
  /\bQTY\b/i,                                               // quantity line
  /\bDIN\s*:?\s*\d{8}\b/i,                                 // DIN number
  /\bREFILL/i,                                              // refill info
];

// ─── drug line ───────────────────────────────────────────────────────────────
// Matches the strength + form portion, e.g. "500MG TABLET", "2.5mg/5mL", "10mcg"
const DOSAGE_UNIT_RE =
  /\d+(?:\.\d+)?\s*(?:mg\/(?:5\s*)?ml|mcg\/ml|mg\/ml|g\/ml|mg|mcg|g|ml|units?|iu|%)/i;

// ─── SIG / directions line ───────────────────────────────────────────────────
const SIG_START_RE =
  /^(TAKE|USE|APPLY|INHALE|INSERT|INSTILL|INJECT|DISSOLVE)\b/i;

function isSkipped(text) {
  return SKIP.some(re => re.test(text));
}

/** "METFORMIN HCL" → "Metformin Hcl" */
function toTitleCase(str) {
  return str.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
}

/**
 * @param {Array<{text: string, cx: number, cy: number, hits: number}>} items
 * @returns {{
 *   medicationName: string|null,
 *   dosage: string|null,
 *   instructions: string|null,
 *   drugNameHits: number,
 *   dosageHits: number,
 * }}
 */
export function parseOntarioRxLabel(items) {
  let medicationName = null;
  let dosage = null;
  let drugNameHits = 0;
  let dosageHits = 0;
  let instructions = null;

  for (const item of items) {
    const text = item.text?.trim();
    if (!text || isSkipped(text)) continue;

    // ── drug line ───────────────────────────────────────────────────────────
    // The drug line has alpha text (the INN name) followed by a dosage unit.
    // e.g. "METFORMIN HCL 500MG TABLET" → name="Metformin Hcl", dosage="500MG TABLET"
    if (medicationName === null) {
      const m = DOSAGE_UNIT_RE.exec(text);
      if (m && m.index > 1) {
        const namePart = text.slice(0, m.index).trim();
        if (/[A-Za-z]{2,}/.test(namePart)) {
          medicationName = toTitleCase(namePart);
          dosage = text.slice(m.index).trim();
          drugNameHits = item.hits;
          dosageHits = item.hits;
          continue;
        }
      }
    }

    // ── SIG / directions ────────────────────────────────────────────────────
    // Instructions confidence is intentionally not gated — take whatever text
    // has been accumulated by the time the drug name reaches threshold.
    if (instructions === null && SIG_START_RE.test(text)) {
      instructions = text;
    }
  }

  return { medicationName, dosage, instructions, drugNameHits, dosageHits };
}
