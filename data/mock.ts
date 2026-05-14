import type { KiloData } from "@/types";

export const KILO_DATA: KiloData = {
  user: {
    name: "Joaco",
    age: 28,
    weight: 73.4,
    weightTarget: 70,
    height: 178,
    activity: "moderado",
    goal: "definir",
  },
  today: {
    date: "Jueves 14 de mayo",
    dateShort: "Jue 14",
    kcalGoal: 2400,
    kcalLogged: 1508,
    macros: {
      protein: { current: 98,  goal: 140, label: "Proteína", code: "P" },
      carbs:   { current: 124, goal: 275, label: "Carbos",   code: "C" },
      fat:     { current: 54,  goal: 67,  label: "Grasas",   code: "G" },
    },
    steps: 7248,
    stepsGoal: 10000,
    water: 4,
    waterGoal: 8,
  },
  meals: [
    {
      id: "breakfast",
      name: "Mañana",
      time: "08:14",
      icon: "sunrise",
      kcal: 620,
      status: "logged",
      items: [
        { id: "avena",  emoji: "🥣", name: "Avena con leche",    portion: "1 taza · 80g",        kcal: 270, p: 12, c: 42, f: 6 },
        { id: "banana", emoji: "🍌", name: "Banana",              portion: "1 unidad · 120g",     kcal: 105, p: 1,  c: 26, f: 0 },
        { id: "cafe",   emoji: "☕", name: "Café con leche",      portion: "Taza grande · 250ml", kcal: 145, p: 8,  c: 12, f: 8 },
      ],
    },
    {
      id: "lunch",
      name: "Mediodía",
      time: "13:02",
      icon: "sun",
      kcal: 888,
      status: "logged",
      items: [
        { id: "pollo",  emoji: "🍗", name: "Pechuga de pollo grillada",    portion: "200g",         kcal: 330, p: 44, c: 0,  f: 16 },
        { id: "arroz",  emoji: "🍚", name: "Arroz blanco cocido",          portion: "1 taza · 180g", kcal: 250, p: 5,  c: 56, f: 1  },
        { id: "palta",  emoji: "🥑", name: "Palta",                        portion: "½ unidad · 75g", kcal: 120, p: 1,  c: 4,  f: 11 },
        { id: "tomate", emoji: "🍅", name: "Tomate cherry + aceite oliva", portion: "120g",          kcal: 188, p: 1,  c: 6,  f: 8  },
      ],
    },
    {
      id: "snack",
      name: "Tarde",
      time: "pendiente",
      icon: "sunset",
      kcal: 0,
      status: "empty",
      items: [],
    },
    {
      id: "dinner",
      name: "Noche",
      time: "pendiente",
      icon: "moon",
      kcal: 0,
      status: "empty",
      items: [],
    },
  ],
  habits: [
    {
      id: "creatina",
      name: "Creatina",
      dose: "5g",
      icon: "pill",
      streak: 14,
      weekDone: [true, true, true, true, false, false, false],
      todayIdx: 3,
      doneToday: true,
      color: "lime",
    },
    {
      id: "water",
      name: "Hidratación",
      dose: "2.5 L · 4 de 8 vasos",
      icon: "droplet",
      streak: 6,
      weekDone: [true, true, true, false, false, false, false],
      todayIdx: 3,
      doneToday: false,
      color: "blue",
    },
    {
      id: "sleep",
      name: "Sueño 8h",
      dose: "Anoche 7h 20m",
      icon: "moon",
      streak: 3,
      weekDone: [false, true, true, true, false, false, false],
      todayIdx: 3,
      doneToday: true,
      color: "violet",
    },
  ],
  weightHistory: [74.0, 74.1, 73.9, 73.7, 73.8, 73.6, 73.4],
  weightDays: ["Vi", "Sa", "Do", "Lu", "Ma", "Mi", "Ju"],
  frequentFoods: [
    { id: "huevo",     emoji: "🍳", name: "Huevo entero",        meta: "1 unidad · 50g",         kcal: 70,  p: 6,  c: 0, f: 5  },
    { id: "leche",     emoji: "🥛", name: "Leche entera",         meta: "La Serenísima · 250ml",  kcal: 150, p: 8,  c: 12, f: 8 },
    { id: "palta",     emoji: "🥑", name: "Palta",                meta: "½ unidad · 75g",         kcal: 120, p: 1,  c: 4,  f: 11 },
    { id: "yogurt",    emoji: "🥄", name: "Yogur griego natural", meta: "170g",                   kcal: 100, p: 17, c: 6,  f: 0  },
    { id: "almendras", emoji: "🥜", name: "Almendras",            meta: "Puñado · 28g",           kcal: 164, p: 6,  c: 6,  f: 14 },
    { id: "mani",      emoji: "🥜", name: "Manteca de maní",      meta: "2 cdas · 32g",           kcal: 190, p: 7,  c: 7,  f: 16 },
    { id: "atun",      emoji: "🐟", name: "Atún al natural",      meta: "Lata · 110g",            kcal: 130, p: 28, c: 0,  f: 2  },
  ],
};

export function pct(current: number, goal: number): number {
  return Math.min(100, Math.round((current / goal) * 100));
}

export function fmtNum(n: number): string {
  return n.toLocaleString("es-AR");
}
