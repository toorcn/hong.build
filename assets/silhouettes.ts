/**
 * The five resolved silhouettes as SVG markup, written to the temp
 * directory by the generator and rasterized to alpha masks with sharp.
 *
 * Everything is drawn in a 1000 x 1000 viewBox centered on (500, 500).
 * Opaque (non-zero alpha) pixels are what get rejection-sampled.
 */

export const SILHOUETTES: readonly string[] = [
  // V0 IDENTITY — the HONG BING wordmark, condensed heavy display type.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <text x="500" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900"
      font-size="218" letter-spacing="2" fill="#fff">HONG</text>
    <text x="500" y="640" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900"
      font-size="218" letter-spacing="2" fill="#fff">BING</text>
  </svg>`,

  // V1 WORK — a window frame: outer wall, header bar, two panes, three dots.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <rect x="150" y="230" width="700" height="540" fill="#fff"/>
    <rect x="214" y="400" width="296" height="306" fill="#000"/>
    <rect x="540" y="400" width="246" height="306" fill="#000"/>
    <circle cx="212" cy="315" r="26" fill="#000"/>
    <circle cx="284" cy="315" r="26" fill="#000"/>
    <circle cx="356" cy="315" r="26" fill="#000"/>
  </svg>`,

  // V2 PROCESS — a recursion loop: two chasing curved arrows.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <path d="M 500 190 A 310 310 0 1 1 203 590" fill="none" stroke="#fff" stroke-width="74" stroke-linecap="round"/>
    <polygon points="196,676 128,516 306,540" fill="#fff"/>
    <path d="M 500 810 A 310 310 0 1 1 797 410" fill="none" stroke="#fff" stroke-width="74" stroke-linecap="round"/>
    <polygon points="804,324 872,484 694,460" fill="#fff"/>
  </svg>`,

  // V3 SIGNALS — a waveform.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <rect x="90"  y="452" width="52" height="96"  rx="10" fill="#fff"/>
    <rect x="172" y="390" width="52" height="220" rx="10" fill="#fff"/>
    <rect x="254" y="300" width="52" height="400" rx="10" fill="#fff"/>
    <rect x="336" y="196" width="52" height="608" rx="10" fill="#fff"/>
    <rect x="418" y="352" width="52" height="296" rx="10" fill="#fff"/>
    <rect x="500" y="262" width="52" height="476" rx="10" fill="#fff"/>
    <rect x="582" y="408" width="52" height="184" rx="10" fill="#fff"/>
    <rect x="664" y="216" width="52" height="568" rx="10" fill="#fff"/>
    <rect x="746" y="372" width="52" height="256" rx="10" fill="#fff"/>
    <rect x="828" y="444" width="52" height="112" rx="10" fill="#fff"/>
  </svg>`,

  // V4 CONTACT — an @ symbol in heavy display type.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <text x="500" y="740" text-anchor="middle" font-family="Georgia, serif" font-weight="700"
      font-size="820" fill="#fff">@</text>
  </svg>`,
] as const;
