const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: "El email o la contraseña no son correctos.",
  email_not_confirmed: "Primero confirmá tu email desde el enlace que te enviamos.",
  user_already_exists: "Ya existe una cuenta con ese email.",
  email_exists: "Ya existe una cuenta con ese email.",
  weak_password: "La contraseña no cumple los requisitos de seguridad.",
  signup_disabled: "El registro de nuevas cuentas está deshabilitado temporalmente.",
  over_request_rate_limit: "Hiciste demasiados intentos. Esperá unos minutos y probá de nuevo.",
  over_email_send_rate_limit: "Ya enviamos varios emails. Esperá unos minutos antes de intentar otra vez.",
  request_timeout: "La solicitud tardó demasiado. Revisá tu conexión e intentá nuevamente.",
  email_address_invalid: "Ingresá una dirección de email válida.",
};

export function authErrorMessage(code?: string, fallback?: string) {
  if (code && AUTH_MESSAGES[code]) return AUTH_MESSAGES[code];
  return fallback || "No pudimos completar la operación. Intentá nuevamente.";
}
