import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// Flat config nativo de Next 16. `core-web-vitals` ya incluye el config base +
// typescript. Antes esto usaba FlatCompat, que rompía con "Converting circular
// structure to JSON" y dejaba el lint sin correr.
const eslintConfig = [
  ...nextCoreWebVitals,
  {
    // Reglas nuevas y experimentales de eslint-plugin-react-hooks v6
    // (React Compiler-aware). Marcan patrones válidos y usados a propósito
    // (leer matchMedia al montar, reset de estado al abrir un sheet, leer un
    // ref para decidir una transición). Las dejamos como advisory (warn) para
    // no bloquear el lint por código que funciona, pero manteniéndolas visibles.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
    },
  },
];

export default eslintConfig;
