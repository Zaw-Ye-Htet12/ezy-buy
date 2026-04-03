/**
 * Checks if the store is currently open based on the opening hours configuration.
 * 
 * @param openingHours JSON object containing opening hours per day (e.g., { monday: { open: '09:00', close: '20:00' } })
 * @param currentTime The date object to check against (defaults to now)
 * @returns boolean
 */
export function isStoreOpen(openingHours: any, currentTime: Date = new Date()): boolean {
  if (!openingHours) return true; // Default to open if no settings found

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[currentTime.getDay()];
  const hours = openingHours[dayName];

  if (!hours || hours.open === 'closed') {
    return false;
  }

  const [openH, openM] = hours.open.split(':').map(Number);
  const [closeH, closeM] = hours.close.split(':').map(Number);

  const currentH = currentTime.getHours();
  const currentM = currentTime.getMinutes();

  const currentTotalMinutes = currentH * 60 + currentM;
  const openTotalMinutes = openH * 60 + openM;
  const closeTotalMinutes = closeH * 60 + closeM;

  // Handle case where closing time is after midnight (e.g., 22:00 to 02:00)
  if (closeTotalMinutes < openTotalMinutes) {
    return currentTotalMinutes >= openTotalMinutes || currentTotalMinutes < closeTotalMinutes;
  }

  return currentTotalMinutes >= openTotalMinutes && currentTotalMinutes < closeTotalMinutes;
}
