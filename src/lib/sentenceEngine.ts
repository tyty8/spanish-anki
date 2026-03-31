// Sentence generation engine — produces thousands of unique Spanish sentences

import { type Verb, type Tense, type Person, conjugate, getEnglishPrompt } from "./conjugation";
export type { Tense };
import { verbs } from "@/data/verbs";

// ─── Word bank types ───

export interface Noun {
  es: string;
  en: string;
  g: "m" | "f"; // gender
}

export interface Adj {
  m: string; // masculine form
  f: string; // feminine form
  en: string;
  type: "ser" | "estar" | "both"; // which verb it pairs with
}

export interface Subject {
  es: string;
  en: string;
  person: Person;
  gender: "m" | "f";
}

export interface TimeExpr {
  es: string;
  en: string;
  tense?: Tense; // if this expression implies a tense
}

export interface Place {
  es: string;
  en: string;
  g: "m" | "f";
}

export interface Adverb {
  es: string;
  en: string;
}

export interface Profession {
  m: string;
  f: string;
  en: string;
}

export interface WordBank {
  nouns: Noun[];
  adjectives: Adj[];
  subjects: Subject[];
  timeExprs: TimeExpr[];
  places: Place[];
  adverbs: Adverb[];
  professions: Profession[];
  transitiveVerbs: string[]; // infinitives of verbs that take objects
  intransitiveVerbs: string[]; // infinitives that don't need objects
  motionVerbs: string[]; // verbs that pair with "a" + place
}

export interface GeneratedSentence {
  id: string;
  words: string[]; // correct Spanish word order
  english: string;
  tense: Tense;
  patternId: string;
}

// ─── Helpers ───

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function hashSentence(words: string[]): string {
  const s = words.join(" ");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return "s" + (h >>> 0).toString(16).padStart(8, "0");
}

function article(gender: "m" | "f", definite: boolean): string {
  if (definite) return gender === "m" ? "el" : "la";
  return gender === "m" ? "un" : "una";
}

function articleEn(definite: boolean, noun: string): string {
  if (definite) return "the";
  return /^[aeiou]/i.test(noun) ? "an" : "a";
}

function findVerb(inf: string): Verb {
  return verbs.find((v) => v.inf === inf) || verbs[0];
}

function englishThirdPerson(base: string): string {
  if (base === "have") return "has";
  if (base === "go") return "goes";
  if (base === "do") return "does";
  if (base === "be") return "is";
  if (/[sxz]$/.test(base) || /[sc]h$/.test(base)) return base + "es";
  if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + "ies";
  return base + "s";
}

function englishVerb(verb: Verb, tense: Tense, person: Person): string {
  switch (tense) {
    case "presente":
      return person === "el" ? englishThirdPerson(verb.en) : verb.en;
    case "preterito":
      return verb.enPast;
    case "imperfecto":
      return "used to " + verb.en;
    case "futuro":
      return "will " + verb.en;
  }
}

function englishSubject(subj: Subject): string {
  return subj.en;
}

function englishNeg(tense: Tense, person: Person, verb: Verb): string {
  switch (tense) {
    case "presente":
      if (person === "el") return "doesn't " + verb.en;
      return "don't " + verb.en;
    case "preterito":
      return "didn't " + verb.en;
    case "imperfecto":
      return "didn't use to " + verb.en;
    case "futuro":
      return "won't " + verb.en;
  }
}

function agreeAdj(adj: Adj, gender: "m" | "f"): string {
  return gender === "m" ? adj.m : adj.f;
}

function pickTense(tenseFilter: Tense | "mixed", timeExpr?: TimeExpr): Tense {
  if (timeExpr?.tense) return timeExpr.tense;
  if (tenseFilter !== "mixed") return tenseFilter;
  return pick<Tense>(["presente", "preterito", "imperfecto", "futuro"]);
}

// ─── Gerund generation ───

function gerund(verb: Verb): string {
  const stem = verb.inf.slice(0, -2);
  if (verb.inf === "ir") return "yendo";
  if (verb.inf === "ser") return "siendo";
  if (verb.inf === "leer") return "leyendo";
  if (verb.inf === "oír") return "oyendo";
  if (verb.inf === "dormir") return "durmiendo";
  if (verb.inf === "morir") return "muriendo";
  if (verb.inf === "decir") return "diciendo";
  if (verb.inf === "pedir") return "pidiendo";
  if (verb.inf === "seguir") return "siguiendo";
  if (verb.inf === "servir") return "sirviendo";
  if (verb.inf === "vestir") return "vistiendo";
  if (verb.inf === "sentir") return "sintiendo";
  if (verb.inf === "venir") return "viniendo";
  if (verb.type === "ar") return stem + "ando";
  return stem + "iendo";
}

function englishGerund(base: string): string {
  if (base === "be") return "being";
  if (base === "lie") return "lying";
  if (base === "die") return "dying";
  if (base.endsWith("ie")) return base.slice(0, -2) + "ying";
  if (base.endsWith("ee")) return base + "ing";
  if (base.endsWith("e") && base.length > 2) return base.slice(0, -1) + "ing";
  if (/^[^aeiou]*[aeiou][bcdfghlmnprst]$/.test(base) && base.length <= 4) {
    return base + base.slice(-1) + "ing";
  }
  return base + "ing";
}

// ─── Sentence patterns ───
// Each returns { words: string[], english: string }

type PatternFn = (wb: WordBank, tenseFilter: Tense | "mixed") => { words: string[]; english: string; tense: Tense; patternId: string } | null;

const patterns: PatternFn[] = [
  // 1. S + V (intransitive): "Ella corre" / "She runs"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const vInf = pick(wb.intransitiveVerbs);
    const verb = findVerb(vInf);
    const tense = pickTense(tf);
    const conjugated = conjugate(verb, tense, subj.person);
    const enVerb = englishVerb(verb, tense, subj.person);
    return {
      words: [subj.es, conjugated],
      english: `${englishSubject(subj)} ${enVerb}`,
      tense,
      patternId: "intransitive",
    };
  },

  // 2. S + V + det + O: "Yo como el pan" / "I eat the bread"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const vInf = pick(wb.transitiveVerbs);
    const verb = findVerb(vInf);
    const noun = pick(wb.nouns);
    const tense = pickTense(tf);
    const definite = Math.random() > 0.3;
    const conjugated = conjugate(verb, tense, subj.person);
    const art = article(noun.g, definite);
    const artEn = articleEn(definite, noun.en);
    return {
      words: [subj.es, conjugated, art, noun.es],
      english: `${englishSubject(subj)} ${englishVerb(verb, tense, subj.person)} ${artEn} ${noun.en}`,
      tense,
      patternId: "s-v-o",
    };
  },

  // 3. S + V + det + adj + N: "Ella compra una casa grande"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const vInf = pick(wb.transitiveVerbs);
    const verb = findVerb(vInf);
    const noun = pick(wb.nouns);
    const adj = pick(wb.adjectives.filter((a) => a.type !== "estar"));
    const tense = pickTense(tf);
    const definite = Math.random() > 0.5;
    const conjugated = conjugate(verb, tense, subj.person);
    const art = article(noun.g, definite);
    const agreed = agreeAdj(adj, noun.g);
    const artEn = articleEn(definite, noun.en);
    return {
      words: [subj.es, conjugated, art, noun.es, agreed],
      english: `${englishSubject(subj)} ${englishVerb(verb, tense, subj.person)} ${artEn} ${adj.en} ${noun.en}`,
      tense,
      patternId: "s-v-adj-o",
    };
  },

  // 4. S + V + adv: "Nosotros corremos rápido"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const vInf = pick(wb.intransitiveVerbs);
    const verb = findVerb(vInf);
    const adv = pick(wb.adverbs);
    const tense = pickTense(tf);
    const conjugated = conjugate(verb, tense, subj.person);
    return {
      words: [subj.es, conjugated, adv.es],
      english: `${englishSubject(subj)} ${englishVerb(verb, tense, subj.person)} ${adv.en}`,
      tense,
      patternId: "s-v-adv",
    };
  },

  // 5. S + V + en + det + place: "Ellos viven en la ciudad"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const vInf = pick(wb.intransitiveVerbs);
    const verb = findVerb(vInf);
    const place = pick(wb.places);
    const tense = pickTense(tf);
    const conjugated = conjugate(verb, tense, subj.person);
    return {
      words: [subj.es, conjugated, "en", article(place.g, true), place.es],
      english: `${englishSubject(subj)} ${englishVerb(verb, tense, subj.person)} in ${articleEn(true, place.en)} ${place.en}`,
      tense,
      patternId: "s-v-en-place",
    };
  },

  // 6. S + V + det + O + en + det + place: "Yo compro el pan en la tienda"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const vInf = pick(wb.transitiveVerbs);
    const verb = findVerb(vInf);
    const noun = pick(wb.nouns);
    const place = pick(wb.places);
    const tense = pickTense(tf);
    const conjugated = conjugate(verb, tense, subj.person);
    return {
      words: [subj.es, conjugated, article(noun.g, true), noun.es, "en", article(place.g, true), place.es],
      english: `${englishSubject(subj)} ${englishVerb(verb, tense, subj.person)} the ${noun.en} at the ${place.en}`,
      tense,
      patternId: "s-v-o-en-place",
    };
  },

  // 7. S + V + det + O + time: "Ella cocinó la cena ayer"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const vInf = pick(wb.transitiveVerbs);
    const verb = findVerb(vInf);
    const noun = pick(wb.nouns);
    const time = pick(wb.timeExprs);
    const tense = pickTense(tf, time);
    const conjugated = conjugate(verb, tense, subj.person);
    return {
      words: [subj.es, conjugated, article(noun.g, true), noun.es, time.es],
      english: `${englishSubject(subj)} ${englishVerb(verb, tense, subj.person)} the ${noun.en} ${time.en}`,
      tense,
      patternId: "s-v-o-time",
    };
  },

  // 8. S + no + V + det + O: "Yo no como la carne"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const vInf = pick(wb.transitiveVerbs);
    const verb = findVerb(vInf);
    const noun = pick(wb.nouns);
    const tense = pickTense(tf);
    const conjugated = conjugate(verb, tense, subj.person);
    return {
      words: [subj.es, "no", conjugated, article(noun.g, true), noun.es],
      english: `${englishSubject(subj)} ${englishNeg(tense, subj.person, verb)} the ${noun.en}`,
      tense,
      patternId: "s-no-v-o",
    };
  },

  // 9. S + estar + adj (emotion/state): "Ella está cansada"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const adj = pick(wb.adjectives.filter((a) => a.type === "estar" || a.type === "both"));
    if (!adj) return null;
    const tense = pickTense(tf);
    const estar = findVerb("estar");
    const conjugated = conjugate(estar, tense, subj.person);
    const agreed = agreeAdj(adj, subj.gender);
    const enVerb = tense === "presente" ? (subj.person === "el" ? "is" : subj.person === "ellos" ? "are" : subj.person === "nosotros" ? "are" : subj.person === "yo" ? "am" : "are")
      : tense === "preterito" ? (subj.person === "yo" || subj.person === "el" ? "was" : "were")
      : tense === "imperfecto" ? "used to be"
      : "will be";
    return {
      words: [subj.es, conjugated, agreed],
      english: `${englishSubject(subj)} ${enVerb} ${adj.en}`,
      tense,
      patternId: "s-estar-adj",
    };
  },

  // 10. S + ser + adj (characteristic): "El restaurante es caro"
  (wb, tf) => {
    const noun = pick(wb.nouns);
    const adj = pick(wb.adjectives.filter((a) => a.type === "ser" || a.type === "both"));
    if (!adj) return null;
    const tense = pickTense(tf);
    const ser = findVerb("ser");
    const conjugated = conjugate(ser, tense, "el");
    const agreed = agreeAdj(adj, noun.g);
    const art = article(noun.g, true);
    const enBe = tense === "presente" ? "is" : tense === "preterito" ? "was" : tense === "imperfecto" ? "used to be" : "will be";
    return {
      words: [art, noun.es, conjugated, agreed],
      english: `the ${noun.en} ${enBe} ${adj.en}`,
      tense,
      patternId: "s-ser-adj",
    };
  },

  // 11. S + ser + profession: "Él es médico"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const prof = pick(wb.professions);
    const tense = pickTense(tf);
    const ser = findVerb("ser");
    const conjugated = conjugate(ser, tense, subj.person);
    const profEs = subj.gender === "m" ? prof.m : prof.f;
    const enBe = tense === "presente" ? (subj.person === "yo" ? "am" : subj.person === "el" ? "is" : "are")
      : tense === "preterito" ? (subj.person === "yo" || subj.person === "el" ? "was" : "were")
      : tense === "imperfecto" ? "used to be"
      : "will be";
    return {
      words: [subj.es, conjugated, profEs],
      english: `${englishSubject(subj)} ${enBe} a ${prof.en}`,
      tense,
      patternId: "s-ser-prof",
    };
  },

  // 12. S + estar + en + det + place: "Nosotros estamos en la casa"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const place = pick(wb.places);
    const tense = pickTense(tf);
    const estar = findVerb("estar");
    const conjugated = conjugate(estar, tense, subj.person);
    const enBe = tense === "presente" ? (subj.person === "yo" ? "am" : subj.person === "el" ? "is" : "are")
      : tense === "preterito" ? (subj.person === "yo" || subj.person === "el" ? "was" : "were")
      : tense === "imperfecto" ? "used to be"
      : "will be";
    return {
      words: [subj.es, conjugated, "en", article(place.g, true), place.es],
      english: `${englishSubject(subj)} ${enBe} at the ${place.en}`,
      tense,
      patternId: "s-estar-en-place",
    };
  },

  // 13. S + V + para + person: "Yo trabajo para mi familia"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const vInf = pick(wb.intransitiveVerbs);
    const verb = findVerb(vInf);
    const recipient = pick(wb.nouns);
    const tense = pickTense(tf);
    const conjugated = conjugate(verb, tense, subj.person);
    return {
      words: [subj.es, conjugated, "para", article(recipient.g, true), recipient.es],
      english: `${englishSubject(subj)} ${englishVerb(verb, tense, subj.person)} for the ${recipient.en}`,
      tense,
      patternId: "s-v-para-noun",
    };
  },

  // 14. A + person + le gusta + det + noun: "A ella le gusta el café"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const noun = pick(wb.nouns);
    const tense = pickTense(tf);
    const gustar = findVerb("gustar");
    const conjugated = conjugate(gustar, tense, "el"); // gusta (singular thing)
    const pronoun = subj.person === "yo" ? "me" : subj.person === "tu" ? "te" : subj.person === "el" ? "le" : subj.person === "nosotros" ? "nos" : "les";
    const enLike = tense === "presente" ? (subj.person === "el" ? "likes" : "like")
      : tense === "preterito" ? "liked"
      : tense === "imperfecto" ? "used to like"
      : "will like";
    return {
      words: ["a", subj.es, pronoun, conjugated, article(noun.g, true), noun.es],
      english: `${englishSubject(subj)} ${enLike} the ${noun.en}`,
      tense,
      patternId: "gustar",
    };
  },

  // 15. S + tener que + inf: "Yo tengo que estudiar"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const vInf = pick([...wb.transitiveVerbs, ...wb.intransitiveVerbs]);
    const verb = findVerb(vInf);
    const tener = findVerb("tener");
    const tense = pickTense(tf);
    const conjugated = conjugate(tener, tense, subj.person);
    const enHave = tense === "presente" ? (subj.person === "el" ? "has" : "have")
      : tense === "preterito" ? "had"
      : tense === "imperfecto" ? "used to have"
      : "will have";
    return {
      words: [subj.es, conjugated, "que", verb.inf],
      english: `${englishSubject(subj)} ${enHave} to ${verb.en}`,
      tense,
      patternId: "tener-que",
    };
  },

  // 16. S + querer + inf: "Ella quiere comer"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const vInf = pick([...wb.transitiveVerbs, ...wb.intransitiveVerbs]);
    const verb = findVerb(vInf);
    const querer = findVerb("querer");
    const tense = pickTense(tf);
    const conjugated = conjugate(querer, tense, subj.person);
    const enWant = tense === "presente" ? (subj.person === "el" ? "wants" : "want")
      : tense === "preterito" ? "wanted"
      : tense === "imperfecto" ? "used to want"
      : "will want";
    return {
      words: [subj.es, conjugated, verb.inf],
      english: `${englishSubject(subj)} ${enWant} to ${verb.en}`,
      tense,
      patternId: "querer-inf",
    };
  },

  // 17. S + poder + inf: "Nosotros podemos ir"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const vInf = pick([...wb.transitiveVerbs, ...wb.intransitiveVerbs]);
    const verb = findVerb(vInf);
    const poder = findVerb("poder");
    const tense = pickTense(tf);
    const conjugated = conjugate(poder, tense, subj.person);
    const enCan = tense === "presente" ? "can"
      : tense === "preterito" ? "could"
      : tense === "imperfecto" ? "used to be able to"
      : "will be able to";
    return {
      words: [subj.es, conjugated, verb.inf],
      english: `${englishSubject(subj)} ${enCan} ${verb.en}`,
      tense,
      patternId: "poder-inf",
    };
  },

  // 18. S + estar + gerund: "Ella está comiendo"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const vInf = pick([...wb.transitiveVerbs, ...wb.intransitiveVerbs]);
    const verb = findVerb(vInf);
    const estar = findVerb("estar");
    // Progressive only makes sense in presente or imperfecto
    const tense = pick<Tense>(["presente", "imperfecto"]);
    const conjugated = conjugate(estar, tense, subj.person);
    const ger = gerund(verb);
    const enBe = tense === "presente" ? (subj.person === "yo" ? "am" : subj.person === "el" ? "is" : "are")
      : "was";
    return {
      words: [subj.es, conjugated, ger],
      english: `${englishSubject(subj)} ${enBe} ${englishGerund(verb.en)}`,
      tense,
      patternId: "estar-gerund",
    };
  },

  // 19. S + V + det + O + porque + S2 + estar + adj
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const vInf = pick(wb.transitiveVerbs);
    const verb = findVerb(vInf);
    const noun = pick(wb.nouns);
    const subj2 = pick(wb.subjects);
    const adj = pick(wb.adjectives.filter((a) => a.type === "estar"));
    if (!adj) return null;
    const tense = pickTense(tf);
    const conjugated = conjugate(verb, tense, subj.person);
    const estar = findVerb("estar");
    const conjugated2 = conjugate(estar, tense, subj2.person);
    const agreed = agreeAdj(adj, subj2.gender);
    const enBe = tense === "presente" ? (subj2.person === "yo" ? "am" : subj2.person === "el" ? "is" : "are")
      : tense === "preterito" ? (subj2.person === "yo" || subj2.person === "el" ? "was" : "were")
      : tense === "imperfecto" ? "used to be"
      : "will be";
    return {
      words: [subj.es, conjugated, article(noun.g, true), noun.es, "porque", subj2.es, conjugated2, agreed],
      english: `${englishSubject(subj)} ${englishVerb(verb, tense, subj.person)} the ${noun.en} because ${englishSubject(subj2)} ${enBe} ${adj.en}`,
      tense,
      patternId: "s-v-o-porque",
    };
  },

  // 20. S + necesitar + inf + det + O: "Necesitamos comprar la comida"
  (wb, tf) => {
    const subj = pick(wb.subjects);
    const vInf = pick(wb.transitiveVerbs);
    const verb = findVerb(vInf);
    const noun = pick(wb.nouns);
    const necesitar = findVerb("necesitar");
    const tense = pickTense(tf);
    const conjugated = conjugate(necesitar, tense, subj.person);
    const enNeed = tense === "presente" ? (subj.person === "el" ? "needs" : "need")
      : tense === "preterito" ? "needed"
      : tense === "imperfecto" ? "used to need"
      : "will need";
    return {
      words: [subj.es, conjugated, verb.inf, article(noun.g, true), noun.es],
      english: `${englishSubject(subj)} ${enNeed} to ${verb.en} the ${noun.en}`,
      tense,
      patternId: "necesitar-inf-o",
    };
  },
];

// ─── Main generator ───

export function generateSentence(
  wb: WordBank,
  tenseFilter: Tense | "mixed",
  usedIds: Set<string>,
  maxAttempts = 50
): GeneratedSentence | null {
  for (let i = 0; i < maxAttempts; i++) {
    const pattern = pick(patterns);
    const result = pattern(wb, tenseFilter);
    if (!result) continue;

    const id = hashSentence(result.words);
    if (usedIds.has(id)) continue;

    usedIds.add(id);
    return {
      id,
      words: result.words,
      english: result.english,
      tense: result.tense,
      patternId: result.patternId,
    };
  }
  return null;
}

// ─── Scrambler ───

export function scrambleWords(words: string[]): string[] {
  const scrambled = [...words];
  // Fisher-Yates shuffle
  for (let i = scrambled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
  }
  // Make sure it's not the same order
  if (scrambled.join(" ") === words.join(" ") && words.length > 1) {
    [scrambled[0], scrambled[1]] = [scrambled[1], scrambled[0]];
  }
  return scrambled;
}
