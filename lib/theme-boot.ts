/**
 * The theme's pre-paint hook. Like entrance-boot.ts, deliberately not a client
 * module: the root layout needs the script string at render time, and the
 * toggle needs the same storage key.
 *
 * Light is the default for everyone. Dark is a choice, remembered here. The
 * field manual (hack-src) reads the same key, so the choice follows a visitor
 * between the two.
 */

export const THEME_STORAGE_KEY = "hb.theme";

/** Browser-chrome colour per scheme: the top of the sky, or the void. */
export const THEME_COLOR = { light: "#9fbcee", dark: "#0a0b0d" } as const;

/**
 * Runs while <head> parses, so a visitor who chose dark never sees a frame of
 * sky first. Same CSP caveat as the entrance script.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark"){document.documentElement.dataset.theme="dark"}}catch(e){}})()`;
