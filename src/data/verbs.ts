import type { Verb } from "@/lib/conjugation";

export const verbs: Verb[] = [
  // 1. ser
  {
    inf: "ser", en: "be", enPast: "was", type: "er",
    pres: { yo: "soy", tu: "eres", el: "es", nosotros: "somos", ellos: "son" },
    pret: { yo: "fui", tu: "fuiste", el: "fue", nosotros: "fuimos", ellos: "fueron" },
    imp: { yo: "era", tu: "eras", el: "era", nosotros: "éramos", ellos: "eran" },
  },
  // 2. estar
  {
    inf: "estar", en: "be", enPast: "was", type: "ar",
    pres: { yo: "estoy", tu: "estás", el: "está", nosotros: "estamos", ellos: "están" },
    pret: "estuv",
  },
  // 3. haber
  {
    inf: "haber", en: "have", enPast: "had", type: "er",
    pres: { yo: "he", tu: "has", el: "ha", nosotros: "hemos", ellos: "han" },
    pret: "hub",
    futStem: "habr",
  },
  // 4. tener
  {
    inf: "tener", en: "have", enPast: "had", type: "er",
    sc: "e-ie",
    pres: { yo: "tengo" },
    pret: "tuv",
    futStem: "tendr",
  },
  // 5. hacer
  {
    inf: "hacer", en: "make", enPast: "made", type: "er",
    pres: { yo: "hago" },
    pret: { yo: "hice", tu: "hiciste", el: "hizo", nosotros: "hicimos", ellos: "hicieron" },
    futStem: "har",
  },
  // 6. poder
  {
    inf: "poder", en: "be able to", enPast: "could", type: "er",
    sc: "o-ue",
    pret: "pud",
    futStem: "podr",
  },
  // 7. decir
  {
    inf: "decir", en: "say", enPast: "said", type: "ir",
    sc: "e-i",
    pres: { yo: "digo" },
    pret: "dij",
    futStem: "dir",
  },
  // 8. ir
  {
    inf: "ir", en: "go", enPast: "went", type: "ir",
    pres: { yo: "voy", tu: "vas", el: "va", nosotros: "vamos", ellos: "van" },
    pret: { yo: "fui", tu: "fuiste", el: "fue", nosotros: "fuimos", ellos: "fueron" },
    imp: { yo: "iba", tu: "ibas", el: "iba", nosotros: "íbamos", ellos: "iban" },
  },
  // 9. querer
  {
    inf: "querer", en: "want", enPast: "wanted", type: "er",
    sc: "e-ie",
    pret: "quis",
    futStem: "querr",
  },
  // 10. saber
  {
    inf: "saber", en: "know", enPast: "knew", type: "er",
    pres: { yo: "sé" },
    pret: "sup",
    futStem: "sabr",
  },
  // 11. dar
  {
    inf: "dar", en: "give", enPast: "gave", type: "ar",
    pres: { yo: "doy" },
    pret: { yo: "di", tu: "diste", el: "dio", nosotros: "dimos", ellos: "dieron" },
  },
  // 12. ver
  {
    inf: "ver", en: "see", enPast: "saw", type: "er",
    pres: { yo: "veo" },
    pret: { yo: "vi", tu: "viste", el: "vio", nosotros: "vimos", ellos: "vieron" },
    imp: { yo: "veía", tu: "veías", el: "veía", nosotros: "veíamos", ellos: "veían" },
  },
  // 13. venir
  {
    inf: "venir", en: "come", enPast: "came", type: "ir",
    sc: "e-ie",
    pres: { yo: "vengo" },
    pret: "vin",
    futStem: "vendr",
  },
  // 14. deber
  {
    inf: "deber", en: "owe", enPast: "owed", type: "er",
  },
  // 15. poner
  {
    inf: "poner", en: "put", enPast: "put", type: "er",
    pres: { yo: "pongo" },
    pret: "pus",
    futStem: "pondr",
  },
  // 16. salir
  {
    inf: "salir", en: "leave", enPast: "left", type: "ir",
    pres: { yo: "salgo" },
    futStem: "saldr",
  },
  // 17. llegar
  {
    inf: "llegar", en: "arrive", enPast: "arrived", type: "ar",
  },
  // 18. pasar
  {
    inf: "pasar", en: "pass", enPast: "passed", type: "ar",
  },
  // 19. hablar
  {
    inf: "hablar", en: "speak", enPast: "spoke", type: "ar",
  },
  // 20. creer
  {
    inf: "creer", en: "believe", enPast: "believed", type: "er",
  },
  // 21. llevar
  {
    inf: "llevar", en: "carry", enPast: "carried", type: "ar",
  },
  // 22. dejar
  {
    inf: "dejar", en: "leave", enPast: "left", type: "ar",
  },
  // 23. seguir
  {
    inf: "seguir", en: "follow", enPast: "followed", type: "ir",
    sc: "e-i",
    pres: { yo: "sigo" },
  },
  // 24. encontrar
  {
    inf: "encontrar", en: "find", enPast: "found", type: "ar",
    sc: "o-ue",
  },
  // 25. llamar
  {
    inf: "llamar", en: "call", enPast: "called", type: "ar",
  },
  // 26. pensar
  {
    inf: "pensar", en: "think", enPast: "thought", type: "ar",
    sc: "e-ie",
  },
  // 27. conocer
  {
    inf: "conocer", en: "know", enPast: "knew", type: "er",
    pres: { yo: "conozco" },
  },
  // 28. vivir
  {
    inf: "vivir", en: "live", enPast: "lived", type: "ir",
  },
  // 29. sentir
  {
    inf: "sentir", en: "feel", enPast: "felt", type: "ir",
    sc: "e-ie",
  },
  // 30. parecer
  {
    inf: "parecer", en: "seem", enPast: "seemed", type: "er",
    pres: { yo: "parezco" },
  },
  // 31. tomar
  {
    inf: "tomar", en: "take", enPast: "took", type: "ar",
  },
  // 32. quedar
  {
    inf: "quedar", en: "stay", enPast: "stayed", type: "ar",
  },
  // 33. pedir
  {
    inf: "pedir", en: "ask for", enPast: "asked for", type: "ir",
    sc: "e-i",
  },
  // 34. mirar
  {
    inf: "mirar", en: "look", enPast: "looked", type: "ar",
  },
  // 35. contar
  {
    inf: "contar", en: "count", enPast: "counted", type: "ar",
    sc: "o-ue",
  },
  // 36. empezar
  {
    inf: "empezar", en: "start", enPast: "started", type: "ar",
    sc: "e-ie",
  },
  // 37. esperar
  {
    inf: "esperar", en: "wait", enPast: "waited", type: "ar",
  },
  // 38. buscar
  {
    inf: "buscar", en: "search", enPast: "searched", type: "ar",
  },
  // 39. entrar
  {
    inf: "entrar", en: "enter", enPast: "entered", type: "ar",
  },
  // 40. trabajar
  {
    inf: "trabajar", en: "work", enPast: "worked", type: "ar",
  },
  // 41. escribir
  {
    inf: "escribir", en: "write", enPast: "wrote", type: "ir",
  },
  // 42. perder
  {
    inf: "perder", en: "lose", enPast: "lost", type: "er",
    sc: "e-ie",
  },
  // 43. acabar
  {
    inf: "acabar", en: "finish", enPast: "finished", type: "ar",
  },
  // 44. traer
  {
    inf: "traer", en: "bring", enPast: "brought", type: "er",
    pres: { yo: "traigo" },
    pret: "traj",
  },
  // 45. comer
  {
    inf: "comer", en: "eat", enPast: "ate", type: "er",
  },
  // 46. dormir
  {
    inf: "dormir", en: "sleep", enPast: "slept", type: "ir",
    sc: "o-ue",
  },
  // 47. necesitar
  {
    inf: "necesitar", en: "need", enPast: "needed", type: "ar",
  },
  // 48. recibir
  {
    inf: "recibir", en: "receive", enPast: "received", type: "ir",
  },
  // 49. morir
  {
    inf: "morir", en: "die", enPast: "died", type: "ir",
    sc: "o-ue",
  },
  // 50. gustar
  {
    inf: "gustar", en: "like", enPast: "liked", type: "ar",
  },
  // 51. abrir
  {
    inf: "abrir", en: "open", enPast: "opened", type: "ir",
  },
  // 52. cambiar
  {
    inf: "cambiar", en: "change", enPast: "changed", type: "ar",
  },
  // 53. comprar
  {
    inf: "comprar", en: "buy", enPast: "bought", type: "ar",
  },
  // 54. entender
  {
    inf: "entender", en: "understand", enPast: "understood", type: "er",
    sc: "e-ie",
  },
  // 55. leer
  {
    inf: "leer", en: "read", enPast: "read", type: "er",
  },
  // 56. correr
  {
    inf: "correr", en: "run", enPast: "ran", type: "er",
  },
  // 57. volver
  {
    inf: "volver", en: "return", enPast: "returned", type: "er",
    sc: "o-ue",
  },
  // 58. jugar
  {
    inf: "jugar", en: "play", enPast: "played", type: "ar",
    sc: "u-ue",
  },
  // 59. caer
  {
    inf: "caer", en: "fall", enPast: "fell", type: "er",
    pres: { yo: "caigo" },
  },
  // 60. usar
  {
    inf: "usar", en: "use", enPast: "used", type: "ar",
  },
  // 61. recordar
  {
    inf: "recordar", en: "remember", enPast: "remembered", type: "ar",
    sc: "o-ue",
  },
  // 62. terminar
  {
    inf: "terminar", en: "finish", enPast: "finished", type: "ar",
  },
  // 63. ganar
  {
    inf: "ganar", en: "win", enPast: "won", type: "ar",
  },
  // 64. pagar
  {
    inf: "pagar", en: "pay", enPast: "paid", type: "ar",
  },
  // 65. ayudar
  {
    inf: "ayudar", en: "help", enPast: "helped", type: "ar",
  },
  // 66. cerrar
  {
    inf: "cerrar", en: "close", enPast: "closed", type: "ar",
    sc: "e-ie",
  },
  // 67. cumplir
  {
    inf: "cumplir", en: "fulfill", enPast: "fulfilled", type: "ir",
  },
  // 68. explicar
  {
    inf: "explicar", en: "explain", enPast: "explained", type: "ar",
  },
  // 69. servir
  {
    inf: "servir", en: "serve", enPast: "served", type: "ir",
    sc: "e-i",
  },
  // 70. aprender
  {
    inf: "aprender", en: "learn", enPast: "learned", type: "er",
  },
  // 71. sacar
  {
    inf: "sacar", en: "take out", enPast: "took out", type: "ar",
  },
  // 72. preguntar
  {
    inf: "preguntar", en: "ask", enPast: "asked", type: "ar",
  },
  // 73. oír
  {
    inf: "oír", en: "hear", enPast: "heard", type: "ir",
    pres: { yo: "oigo", tu: "oyes", el: "oye", ellos: "oyen" },
  },
  // 74. vender
  {
    inf: "vender", en: "sell", enPast: "sold", type: "er",
  },
  // 75. mantener
  {
    inf: "mantener", en: "maintain", enPast: "maintained", type: "er",
    sc: "e-ie",
    pres: { yo: "mantengo" },
    pret: "mantuv",
    futStem: "mantendr",
  },
  // 76. crear
  {
    inf: "crear", en: "create", enPast: "created", type: "ar",
  },
  // 77. decidir
  {
    inf: "decidir", en: "decide", enPast: "decided", type: "ir",
  },
  // 78. subir
  {
    inf: "subir", en: "go up", enPast: "went up", type: "ir",
  },
  // 79. bajar
  {
    inf: "bajar", en: "go down", enPast: "went down", type: "ar",
  },
  // 80. caminar
  {
    inf: "caminar", en: "walk", enPast: "walked", type: "ar",
  },
  // 81. mover
  {
    inf: "mover", en: "move", enPast: "moved", type: "er",
    sc: "o-ue",
  },
  // 82. ofrecer
  {
    inf: "ofrecer", en: "offer", enPast: "offered", type: "er",
    pres: { yo: "ofrezco" },
  },
  // 83. nacer
  {
    inf: "nacer", en: "be born", enPast: "was born", type: "er",
    pres: { yo: "nazco" },
  },
  // 84. tocar
  {
    inf: "tocar", en: "touch", enPast: "touched", type: "ar",
  },
  // 85. mostrar
  {
    inf: "mostrar", en: "show", enPast: "showed", type: "ar",
    sc: "o-ue",
  },
  // 86. responder
  {
    inf: "responder", en: "answer", enPast: "answered", type: "er",
  },
  // 87. importar
  {
    inf: "importar", en: "matter", enPast: "mattered", type: "ar",
  },
  // 88. comenzar
  {
    inf: "comenzar", en: "begin", enPast: "began", type: "ar",
    sc: "e-ie",
  },
  // 89. añadir
  {
    inf: "añadir", en: "add", enPast: "added", type: "ir",
  },
  // 90. intentar
  {
    inf: "intentar", en: "try", enPast: "tried", type: "ar",
  },
  // 91. producir
  {
    inf: "producir", en: "produce", enPast: "produced", type: "ir",
    pres: { yo: "produzco" },
    pret: "produj",
  },
  // 92. construir
  {
    inf: "construir", en: "build", enPast: "built", type: "ir",
    pres: { yo: "construyo", tu: "construyes", el: "construye", ellos: "construyen" },
  },
  // 93. mandar
  {
    inf: "mandar", en: "send", enPast: "sent", type: "ar",
  },
  // 94. compartir
  {
    inf: "compartir", en: "share", enPast: "shared", type: "ir",
  },
  // 95. lograr
  {
    inf: "lograr", en: "achieve", enPast: "achieved", type: "ar",
  },
  // 96. sentar
  {
    inf: "sentar", en: "sit", enPast: "sat", type: "ar",
    sc: "e-ie",
  },
  // 97. levantar
  {
    inf: "levantar", en: "lift", enPast: "lifted", type: "ar",
  },
  // 98. despertar
  {
    inf: "despertar", en: "wake up", enPast: "woke up", type: "ar",
    sc: "e-ie",
  },
  // 99. vestir
  {
    inf: "vestir", en: "dress", enPast: "dressed", type: "ir",
    sc: "e-i",
  },
  // 100. cocinar
  {
    inf: "cocinar", en: "cook", enPast: "cooked", type: "ar",
  },
];
