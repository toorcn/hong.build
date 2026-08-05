/**
 * The entrance's pre-paint hook. Deliberately not a client module: the root
 * layout needs the script string at render time, and ColdStart needs the same
 * storage key, so both come from here and can't drift apart.
 */

/** Set once the entrance has finished (or been skipped) this session. */
export const ENTRANCE_SEEN_KEY = "lab.entrance.seen";

/** `/?entrance=1` forces the cold start to play again. */
export const ENTRANCE_FORCE_PARAM = "entrance";

/**
 * Runs synchronously while the browser parses <head>, before first paint.
 *
 * The chrome and journey overlays are in the server HTML, so without this
 * they paint at full opacity and then fade *out* once ColdStart's effect
 * lands — which shows the visitor the name a beat before the entrance is
 * supposed to reveal it. Setting the attribute during parsing means the
 * hidden state is the first thing painted.
 *
 * It must be an inline script rather than a server-rendered attribute: with
 * JS disabled nothing runs, so the chrome stays visible instead of being
 * permanently hidden by an attribute no one is left to remove.
 *
 * Note: blocked by a Content-Security-Policy without 'unsafe-inline'. If a
 * CSP is added later this needs a nonce.
 */
export const ENTRANCE_BOOT_SCRIPT = `(function(){try{var k="${ENTRANCE_SEEN_KEY}";var force=/(?:^|[?&])${ENTRANCE_FORCE_PARAM}=1(?:&|$)/.test(location.search);if(force){try{sessionStorage.removeItem(k)}catch(e){}}if(location.pathname==="/"&&(force||sessionStorage.getItem(k)!=="1")){document.documentElement.dataset.entrance="boot"}}catch(e){}})()`;
