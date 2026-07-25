/**
 * Emoji representativo para un alimento a partir de su nombre. Sirve para que el
 * diario y el dashboard sean escaneables de un vistazo en vez de mostrar 🍽️ para
 * todo. Match por palabra clave, sin acentos y case-insensitive; el primer grupo
 * que aparezca en el nombre gana, así que el orden va de más específico a más
 * genérico. Fallback: 🍽️.
 */

const norm = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// Orden importante: lo más específico primero (ej. "leche de almendra" cae en
// leche; "fruta" al final para no pisar frutas puntuales). [emoji, keywords].
const RULES: [string, string[]][] = [
  ["🍌", ["banana", "platano"]],
  ["🍓", ["frutilla", "fresa"]],
  ["🍊", ["naranja", "mandarina", "clementina"]],
  ["🍇", ["uva"]],
  ["🍉", ["sandia"]],
  ["🍈", ["melon"]],
  ["🍐", ["pera"]],
  ["🍑", ["durazno", "melocoton"]],
  ["🍒", ["cereza"]],
  ["🥝", ["kiwi"]],
  ["🍍", ["anana", "pina"]],
  ["🥭", ["mango"]],
  ["🫐", ["arandano"]],
  ["🍎", ["manzana"]],
  // Proteínas antes que verduras/almidones: en un plato mixto suele ser lo
  // principal (ej. "milanesa con puré" → 🥩, no 🥔).
  ["🍗", ["pollo", "pechuga", "muslo", "pavo"]],
  ["🥩", ["carne", "bife", "asado", "milanesa", "vacio", "lomo", "nalga", "peceto", "cerdo", "chorizo"]],
  ["🍤", ["camaron", "langostino", "gamba"]],
  ["🐟", ["pescado", "merluza", "salmon", "atun", "trucha", "sardina"]],
  ["🥚", ["huevo", "clara", "tortilla", "omelet"]],
  ["🍅", ["tomate"]],
  ["🥑", ["palta", "aguacate"]],
  ["🥦", ["brocoli"]],
  ["🥕", ["zanahoria"]],
  ["🌽", ["choclo", "maiz"]],
  ["🥔", ["papa", "patata", "pure"]],
  ["🍠", ["batata", "boniato"]],
  ["🧅", ["cebolla"]],
  ["🥒", ["pepino"]],
  ["🥬", ["lechuga", "espinaca", "acelga", "rucula", "kale"]],
  ["🍄", ["hongo", "champinon"]],
  ["🫑", ["morron", "pimiento", "aji"]],
  ["🥗", ["ensalada"]],
  ["🍔", ["hamburguesa", "burger"]],
  ["🌭", ["pancho", "hot dog", "salchicha"]],
  ["🍕", ["pizza", "muzzarella", "mozzarella"]],
  ["🌮", ["taco"]],
  ["🌯", ["burrito", "wrap"]],
  ["🥪", ["sandwich", "sanguche", "tostado"]],
  ["🥓", ["panceta", "bacon", "tocino"]],
  ["🧀", ["queso", "ricota"]],
  // Café/mate antes que leche: "café con leche" → ☕ (la bebida manda).
  ["☕", ["cafe", "capuchino", "espresso", "latte"]],
  ["🧉", ["mate"]],
  ["🥛", ["leche", "yogur", "yoghurt"]],
  ["🧈", ["manteca", "mantequilla"]],
  ["🫒", ["aceite", "aceituna", "oliva"]],
  ["🍚", ["arroz", "risotto"]],
  ["🍝", ["fideo", "pasta", "tallarin", "spaghetti", "ravioles", "noqui", "sorrentino"]],
  ["🥟", ["empanada", "ravioli", "dumpling"]],
  ["🍜", ["sopa", "caldo", "ramen"]],
  ["🫘", ["poroto", "lenteja", "garbanzo", "frijol", "legumbre"]],
  ["🥜", ["mani", "cacahuate", "almendra", "nuez", "nueces", "pistacho", "castana", "semilla"]],
  ["🥐", ["medialuna", "factura", "croissant"]],
  ["🥞", ["panqueque", "pancake", "waffle"]],
  ["🥣", ["avena", "granola", "cereal", "muesli"]],
  ["🍞", ["pan", "tostada", "baguette"]],
  ["🍪", ["galleta", "galletita", "cookie"]],
  ["🍫", ["chocolate", "cacao"]],
  ["🍰", ["torta", "budin", "pastel", "cheesecake"]],
  ["🧁", ["muffin", "magdalena", "cupcake"]],
  ["🍦", ["helado", "postre"]],
  ["🍯", ["miel"]],
  ["🍬", ["caramelo", "golosina", "gomita"]],
  ["🍩", ["dona", "donut"]],
  ["🥤", ["gaseosa", "refresco", "coca", "sprite", "bebida"]],
  ["🧃", ["jugo", "zumo", "smoothie", "licuado"]],
  ["🍺", ["cerveza", "birra"]],
  ["🍷", ["vino"]],
  ["💧", ["agua"]],
  ["🥫", ["conserva", "salsa"]],
  ["🍏", ["fruta"]],
];

export function foodEmoji(name: string | null | undefined): string {
  if (!name) return "🍽️";
  const n = norm(name);
  for (const [emoji, keys] of RULES) {
    for (const k of keys) {
      if (n.includes(k)) return emoji;
    }
  }
  return "🍽️";
}
