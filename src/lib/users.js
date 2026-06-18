export const PHIL_EMAIL = "phelding@thepsychassociates.com";
export const GEORGE_EMAIL = "georgehelding92@gmail.com";

export const PHIL_PHONE = "+17089975028";
export const GEORGE_PHONE = "+17082855028";

export function userFromEmail(email) {
  if (email === PHIL_EMAIL) return "Phil";
  if (email === GEORGE_EMAIL) return "George";
  return null;
}
