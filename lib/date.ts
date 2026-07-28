/**
 * Helpers de fecha local. `eaten_at` y compañía son `timestamptz` (se guardan en
 * UTC); cuando filtramos "el día X" queremos el día X en la zona horaria del
 * usuario, no en UTC. Comparar contra strings sin offset (`${date}T00:00:00`)
 * los interpreta como UTC y descuadra las comidas nocturnas (ej: en AR, UTC-3,
 * una comida de las 22:00 se guarda a las 01:00 UTC del día siguiente y caía
 * fuera de la ventana). Estos helpers construyen los límites en hora local y los
 * pasan a UTC (ISO), así el filtro respeta el día tal como lo vive el usuario.
 */

/** Fecha local de hoy como YYYY-MM-DD (no UTC). "en-CA" formatea como ISO. */
export function todayLocal(): string {
  return new Date().toLocaleDateString("en-CA");
}

/** Fecha local de un Date como YYYY-MM-DD. */
export function toLocalDate(d: Date): string {
  return d.toLocaleDateString("en-CA");
}

/**
 * Rango UTC [start, end] que cubre el día local `date` (YYYY-MM-DD), listo para
 * filtrar una columna `timestamptz` con `.gte(start).lte(end)`.
 * Un string sin offset (`${date}T00:00:00`) lo parsea el runtime como hora LOCAL;
 * `.toISOString()` lo convierte al instante UTC equivalente.
 */
export function localDayRangeUtc(date: string): { start: string; end: string } {
  return {
    start: new Date(`${date}T00:00:00.000`).toISOString(),
    end: new Date(`${date}T23:59:59.999`).toISOString(),
  };
}

/** Instante UTC (ISO) del mediodía local de `date`. Sirve para anclar registros
 * en días pasados dentro del día local correcto, sin importar la zona horaria. */
export function localNoonUtc(date: string): string {
  return new Date(`${date}T12:00:00.000`).toISOString();
}
