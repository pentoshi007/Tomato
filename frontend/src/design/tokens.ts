/**
 * JS-side mirror of the @theme tokens in src/index.css. Leaflet route colors,
 * SVG props and provider themes take plain strings, so they import from here
 * instead of reading CSS variables. Keep both files in sync.
 */
export const colors = {
  tomato: "#E8402F",
  tomatoDeep: "#C22B1D",
  tomatoDark: "#9E2317",
  tomatoWash: "#FDE3DB",
  ink: "#1A1512",
  paper: "#FFF7F0",
  butter: "#FFC72C",
  butterWash: "#FFF3D6",
  basil: "#1E7A46",
  basilWash: "#E2F2E8",
  blue: "#2456D6",
  blueWash: "#E3EAFB",
  line: "#E9E2D9",
  lineStrong: "#D6CCBF",
} as const;

export type ColorToken = keyof typeof colors;
