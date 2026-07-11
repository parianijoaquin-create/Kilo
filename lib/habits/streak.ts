/** Fecha local YYYY-MM-DD (no UTC), para no adelantar el día de noche en zonas UTC-. */
export function ymdLocal(d: Date): string {
  return d.toLocaleDateString("en-CA");
}

/**
 * Racha actual: cantidad de días consecutivos con status "done" terminando hoy.
 *
 * Si hoy todavía no se marcó pero ayer sí, la racha sigue viva y se cuenta desde
 * ayer (el día en curso está pendiente, no roto). Recién se corta cuando hay un
 * día sin marcar antes de ayer.
 */
export function currentStreak(doneDates: Iterable<string>, today: Date = new Date()): number {
  const done = doneDates instanceof Set ? doneDates : new Set(doneDates);
  const cursor = new Date(today);

  // Hoy pendiente → arrancar desde ayer; si ayer tampoco está, no hay racha.
  if (!done.has(ymdLocal(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!done.has(ymdLocal(cursor))) return 0;
  }

  let streak = 0;
  while (done.has(ymdLocal(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
