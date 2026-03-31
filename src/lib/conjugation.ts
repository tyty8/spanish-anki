// Conjugation engine — generates Spanish verb forms and English prompts

export type Person = "yo" | "tu" | "el" | "nosotros" | "ellos";
export type Tense = "presente" | "preterito" | "imperfecto" | "futuro";
export type VerbType = "ar" | "er" | "ir";
export type StemChange = "e-ie" | "o-ue" | "e-i" | "u-ue";

export interface Verb {
  inf: string; // infinitive
  en: string; // english base: "speak"
  enPast: string; // english past: "spoke"
  type: VerbType;
  sc?: StemChange; // stem change
  // Irregular overrides (sparse — only store what's irregular)
  pres?: Partial<Record<Person, string>>; // presente overrides
  pret?: Partial<Record<Person, string>> | string; // pretérito: full overrides OR irregular stem
  imp?: Partial<Record<Person, string>>; // imperfecto overrides (only ser/ir/ver)
  futStem?: string; // irregular future stem (tendr-, podr-, etc.)
}

// ─── Regular endings ───

const PRES_ENDINGS: Record<VerbType, Record<Person, string>> = {
  ar: { yo: "o", tu: "as", el: "a", nosotros: "amos", ellos: "an" },
  er: { yo: "o", tu: "es", el: "e", nosotros: "emos", ellos: "en" },
  ir: { yo: "o", tu: "es", el: "e", nosotros: "imos", ellos: "en" },
};

const PRET_ENDINGS_AR: Record<Person, string> = {
  yo: "é", tu: "aste", el: "ó", nosotros: "amos", ellos: "aron",
};
const PRET_ENDINGS_ER_IR: Record<Person, string> = {
  yo: "í", tu: "iste", el: "ió", nosotros: "imos", ellos: "ieron",
};
// Irregular pretérito stems use these (no accents)
const PRET_ENDINGS_IRR: Record<Person, string> = {
  yo: "e", tu: "iste", el: "o", nosotros: "imos", ellos: "ieron",
};
// -j stems use -eron not -ieron
const PRET_ENDINGS_J: Record<Person, string> = {
  yo: "e", tu: "iste", el: "o", nosotros: "imos", ellos: "eron",
};

const IMP_ENDINGS_AR: Record<Person, string> = {
  yo: "aba", tu: "abas", el: "aba", nosotros: "ábamos", ellos: "aban",
};
const IMP_ENDINGS_ER_IR: Record<Person, string> = {
  yo: "ía", tu: "ías", el: "ía", nosotros: "íamos", ellos: "ían",
};

const FUT_ENDINGS: Record<Person, string> = {
  yo: "é", tu: "ás", el: "á", nosotros: "emos", ellos: "án",
};

// ─── Helpers ───

function getStem(inf: string): string {
  return inf.slice(0, -2);
}

function applyStemChange(stem: string, sc: StemChange): string {
  // Find the LAST occurrence of the vowel to change
  switch (sc) {
    case "e-ie": {
      const i = stem.lastIndexOf("e");
      return i >= 0 ? stem.slice(0, i) + "ie" + stem.slice(i + 1) : stem;
    }
    case "o-ue": {
      const i = stem.lastIndexOf("o");
      return i >= 0 ? stem.slice(0, i) + "ue" + stem.slice(i + 1) : stem;
    }
    case "e-i": {
      const i = stem.lastIndexOf("e");
      return i >= 0 ? stem.slice(0, i) + "i" + stem.slice(i + 1) : stem;
    }
    case "u-ue": {
      const i = stem.lastIndexOf("u");
      return i >= 0 ? stem.slice(0, i) + "ue" + stem.slice(i + 1) : stem;
    }
  }
}

// Stem changes apply to all persons EXCEPT nosotros in presente
function stemChangesInPresente(person: Person): boolean {
  return person !== "nosotros";
}

// In pretérito, -ir stem-changing verbs change in él and ellos only (e→i, o→u)
function getPretStemChange(sc: StemChange, person: Person): string | null {
  if (person !== "el" && person !== "ellos") return null;
  if (sc === "e-ie" || sc === "e-i") return "e-i";
  if (sc === "o-ue") return "o-u";
  return null;
}

function applyStemChangePreterito(stem: string, change: string): string {
  if (change === "e-i") {
    const i = stem.lastIndexOf("e");
    return i >= 0 ? stem.slice(0, i) + "i" + stem.slice(i + 1) : stem;
  }
  if (change === "o-u") {
    const i = stem.lastIndexOf("o");
    return i >= 0 ? stem.slice(0, i) + "u" + stem.slice(i + 1) : stem;
  }
  return stem;
}

// ─── Main conjugation function ───

export function conjugate(verb: Verb, tense: Tense, person: Person): string {
  // Check for direct override first
  if (tense === "presente" && verb.pres?.[person]) return verb.pres[person]!;
  if (tense === "imperfecto" && verb.imp?.[person]) return verb.imp[person]!;
  if (tense === "preterito" && typeof verb.pret === "object" && verb.pret?.[person]) {
    return verb.pret[person]!;
  }

  const stem = getStem(verb.inf);

  switch (tense) {
    case "presente": {
      let s = stem;
      if (verb.sc && stemChangesInPresente(person)) {
        s = applyStemChange(stem, verb.sc);
      }
      return s + PRES_ENDINGS[verb.type][person];
    }

    case "preterito": {
      // Irregular stem (string value in pret field)
      if (typeof verb.pret === "string") {
        const irrStem = verb.pret;
        const endings = irrStem.endsWith("j") ? PRET_ENDINGS_J : PRET_ENDINGS_IRR;
        return irrStem + endings[person];
      }

      // Spelling changes for -car, -gar, -zar (yo only)
      if (person === "yo" && verb.type === "ar") {
        if (verb.inf.endsWith("car")) return stem.slice(0, -1) + "qué";
        if (verb.inf.endsWith("gar")) return stem.slice(0, -1) + "gué";
        if (verb.inf.endsWith("zar")) return stem.slice(0, -1) + "cé";
      }

      let s = stem;
      // -ir verbs with stem changes: él/ellos get e→i or o→u in pretérito
      if (verb.type === "ir" && verb.sc) {
        const change = getPretStemChange(verb.sc, person);
        if (change) s = applyStemChangePreterito(stem, change);
      }

      const endings = verb.type === "ar" ? PRET_ENDINGS_AR : PRET_ENDINGS_ER_IR;
      return s + endings[person];
    }

    case "imperfecto": {
      const endings = verb.type === "ar" ? IMP_ENDINGS_AR : IMP_ENDINGS_ER_IR;
      return stem + endings[person];
    }

    case "futuro": {
      const futBase = verb.futStem || verb.inf;
      return futBase + FUT_ENDINGS[person];
    }
  }
}

// ─── English prompt generation ───

function englishThirdPerson(base: string): string {
  if (base === "have") return "has";
  if (base === "go") return "goes";
  if (base === "do") return "does";
  if (base === "be") return "is";
  if (/[sxz]$/.test(base) || /[sc]h$/.test(base)) return base + "es";
  if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + "ies";
  return base + "s";
}

function englishGerund(base: string): string {
  if (base === "be") return "being";
  if (base === "lie") return "lying";
  if (base === "die") return "dying";
  if (base.endsWith("ie")) return base.slice(0, -2) + "ying";
  if (base.endsWith("ee")) return base + "ing";
  if (base.endsWith("e")) return base.slice(0, -1) + "ing";
  // Double final consonant for short verbs: run→running, swim→swimming
  if (/^[^aeiou]*[aeiou][^aeiou]$/.test(base)) return base + base.slice(-1) + "ing";
  return base + "ing";
}

const PERSON_LABELS: Record<Person, string> = {
  yo: "I", tu: "you", el: "he/she", nosotros: "we", ellos: "they",
};

export function getEnglishPrompt(verb: Verb, tense: Tense, person: Person): string {
  const subj = PERSON_LABELS[person];

  switch (tense) {
    case "presente":
      if (person === "el") return `${subj} ${englishThirdPerson(verb.en)}`;
      return `${subj} ${verb.en}`;

    case "preterito":
      return `${subj} ${verb.enPast}`;

    case "imperfecto":
      return `${subj} used to ${verb.en}`;

    case "futuro":
      return `${subj} will ${verb.en}`;
  }
}

// ─── Card generation for study mode ───

export function stableVerbId(inf: string, tense: string, person: string): string {
  const s = `verb-${inf}-${tense}-${person}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return "v" + (h >>> 0).toString(16).padStart(8, "0");
}

const TENSE_LABELS: Record<Tense, string> = {
  presente: "Presente",
  preterito: "Pretérito",
  imperfecto: "Imperfecto",
  futuro: "Futuro",
};

const PERSON_ES_LABELS: Record<Person, string> = {
  yo: "yo", tu: "tú", el: "él/ella", nosotros: "nosotros", ellos: "ellos",
};

export interface VerbCard {
  id: string;
  front: string; // English prompt
  correctAnswer: string; // correct Spanish conjugation
  tense: Tense;
  person: Person;
  verb: Verb;
  tags: string[];
}

export function generateVerbCard(verb: Verb, tense: Tense, person: Person): VerbCard {
  return {
    id: stableVerbId(verb.inf, tense, person),
    front: getEnglishPrompt(verb, tense, person),
    correctAnswer: conjugate(verb, tense, person),
    tense,
    person,
    verb,
    tags: [`verb-${tense}`],
  };
}

export function generateDistractors(
  verb: Verb,
  tense: Tense,
  person: Person,
  allVerbs: Verb[]
): string[] {
  const correct = conjugate(verb, tense, person);
  const options = new Set<string>();
  options.add(correct);

  // Distractor 1-2: same verb, different tenses
  const otherTenses: Tense[] = (["presente", "preterito", "imperfecto", "futuro"] as Tense[])
    .filter((t) => t !== tense);
  for (const t of otherTenses) {
    if (options.size >= 4) break;
    const form = conjugate(verb, t, person);
    if (form !== correct) options.add(form);
  }

  // Distractor 3: same verb, different person, same tense
  const otherPersons: Person[] = (["yo", "tu", "el", "nosotros", "ellos"] as Person[])
    .filter((p) => p !== person);
  for (const p of otherPersons) {
    if (options.size >= 4) break;
    const form = conjugate(verb, tense, p);
    if (form !== correct && !options.has(form)) options.add(form);
  }

  // Distractor 4+: similar verb, same tense/person
  if (options.size < 4) {
    const shuffled = [...allVerbs].sort(() => Math.random() - 0.5);
    for (const v of shuffled) {
      if (options.size >= 4) break;
      if (v.inf === verb.inf) continue;
      const form = conjugate(v, tense, person);
      if (form !== correct && !options.has(form)) options.add(form);
    }
  }

  const distractors = [...options].filter((o) => o !== correct);
  return distractors.slice(0, 3);
}

export const ALL_TENSES: Tense[] = ["presente", "preterito", "imperfecto", "futuro"];
export const ALL_PERSONS: Person[] = ["yo", "tu", "el", "nosotros", "ellos"];
export { TENSE_LABELS, PERSON_ES_LABELS };
