/**
 * Helpers de date pour l'app Field Intelligence.
 * Toutes les fonctions respectent la norme ISO-8601.
 */

/**
 * Retourne le numero de semaine ISO-8601 (1..53) d'une date donnee.
 * La semaine ISO commence le lundi ; la semaine 1 est celle qui contient le 4 janvier.
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Jeudi de la semaine courante : permet de rattacher les lundis/dimanches au bon numero
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Formate le numero de semaine ISO sous la forme "S<semaine>".
 */
export function formatISOWeek(date: Date): string {
  return `S${getISOWeekNumber(date)}`;
}
