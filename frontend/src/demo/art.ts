const INK = "#221610";

const GLYPHS = {
  pizza: `<path d="M32 56 12 16c13-6 27-6 40 0L32 56Z" fill="#FFC24B" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M12 16c13-6 27-6 40 0l-3 6c-11-5-23-5-34 0l-3-6Z" fill="#E8913F" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="26" cy="28" r="4.5" fill="#E23744" stroke="${INK}" stroke-width="2.6"/><circle cx="38" cy="28" r="4.5" fill="#E23744" stroke="${INK}" stroke-width="2.6"/><circle cx="32" cy="40" r="4.5" fill="#E23744" stroke="${INK}" stroke-width="2.6"/>`,
  burger: `<path d="M10 31C10 19 20 12 32 12s22 7 22 19H10Z" fill="#F2A94B" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M8 31h48v4c-3 4-6 4-9 0s-6 4-9 0-6 4-9 0-6 4-9 0-6 4-9 0-3-4-3-4V31Z" fill="#1E9E62" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><rect x="10" y="43" width="44" height="6" rx="3" fill="#8A5A2B" stroke="${INK}" stroke-width="3"/><path d="M12 49h40v3c0 4.5-4 7.5-9 7.5H21c-5 0-9-3-9-7.5v-3Z" fill="#F2A94B" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
  biryani: `<path d="M25 6c-3 3 3 5 0 8" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/><path d="M37 6c-3 3 3 5 0 8" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/><path d="M13 30c2-9 36-9 38 0H13Z" fill="#FFF3D6" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M11 30h42c0 13-9 22-21 22S11 43 11 30Z" fill="#3D7DD8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M18 38c2 5 6 8 11 9" stroke="#FFFDF9" stroke-width="2.6" stroke-linecap="round"/>`,
  taco: `<circle cx="20" cy="42" r="5" fill="#1E9E62" stroke="${INK}" stroke-width="2.6"/><circle cx="28" cy="38" r="5" fill="#E23744" stroke="${INK}" stroke-width="2.6"/><circle cx="36" cy="38" r="5" fill="#1E9E62" stroke="${INK}" stroke-width="2.6"/><circle cx="44" cy="42" r="5" fill="#E23744" stroke="${INK}" stroke-width="2.6"/><path d="M9 47a23 23 0 0 1 46 0H9Z" fill="#FFC24B" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
  dessert: `<circle cx="32" cy="32" r="20" fill="#F2A94B" stroke="${INK}" stroke-width="3"/><path d="M32 16.5c8.6 0 15.5 7 15.5 15.5 0 3-1.8 4.4-3.8 4.4-4 0-3.4-4.4-7-4.4s-3.4 5-7.4 5-3.6-4.4-7-4.4c-2 0-3.8-1.4-3.8-4.4 0-8.5 4.9-15.5 13.5-15.5Z" fill="#FF8FA3" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/><circle cx="32" cy="32" r="5.6" fill="#FFF5EA" stroke="${INK}" stroke-width="2.8"/>`,
  shake: `<path d="M37 15V7.5h9" stroke="#E23744" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><rect x="17" y="14" width="30" height="7.5" rx="3.7" fill="#E23744" stroke="${INK}" stroke-width="2.8"/><path d="M20 21.5h24l-3 36.5H23L20 21.5Z" fill="#FFFDF9" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M21.6 31h20.8l-.9 11H22.5l-.9-11Z" fill="#FFB627" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`,
  fries: `<rect x="29" y="4" width="6.5" height="30" rx="3.2" fill="#FFC24B" stroke="${INK}" stroke-width="2.6"/><rect x="19" y="8" width="6.5" height="26" rx="3.2" fill="#FFC24B" stroke="${INK}" stroke-width="2.6"/><rect x="39" y="8" width="6.5" height="26" rx="3.2" fill="#FFC24B" stroke="${INK}" stroke-width="2.6"/><path d="M13 27h38l-4.5 31h-29L13 27Z" fill="#E23744" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M13 27h38l-1.2 8H14.2L13 27Z" fill="#FFFDF9" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`,
  rider: `<path d="M14 46.5h22l6.5-13H51" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" fill="none"/><path d="M51 33.5l4.5-8h4" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" fill="none"/><path d="M28 33.5h13l-3-8.5H30l-2 8.5Z" fill="#E23744" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><rect x="6" y="18" width="15" height="13" rx="2.5" fill="#FFB627" stroke="${INK}" stroke-width="2.8"/><circle cx="16" cy="46.5" r="7.5" fill="#FFFDF9" stroke="${INK}" stroke-width="3.2"/><circle cx="50" cy="46.5" r="7.5" fill="#FFFDF9" stroke="${INK}" stroke-width="3.2"/>`,
} as const;

export type ArtKind = keyof typeof GLYPHS;

const TONES: Record<ArtKind, [string, string]> = {
  pizza: ["#FFEDC2", "#FFC24B"],
  burger: ["#FFDCD8", "#F2A94B"],
  biryani: ["#D8E8FB", "#3D7DD8"],
  taco: ["#D7F0E1", "#FFC24B"],
  dessert: ["#FFDCD8", "#FF8FA3"],
  shake: ["#FFEDC2", "#FFFDF9"],
  fries: ["#D7F0E1", "#E23744"],
  rider: ["#D8E8FB", "#FFB627"],
};

const build = (kind: ArtKind): string => {
  const [bg, accent] = TONES[kind];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200"><rect width="320" height="200" fill="${bg}"/><circle cx="160" cy="104" r="68" fill="${accent}" stroke="${INK}" stroke-width="4"/><g transform="translate(96,40) scale(2)">${GLYPHS[kind]}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const cache = new Map<ArtKind, string>();

export const demoArt = (kind: ArtKind): string => {
  const cached = cache.get(kind);
  if (cached) return cached;
  const url = build(kind);
  cache.set(kind, url);
  return url;
};
