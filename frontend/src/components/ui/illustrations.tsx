import type { CSSProperties, ComponentType } from "react";

interface IlluProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export type RoleIllustration = ComponentType<IlluProps>;

const INK = "#221610";

export const Burger = ({ size = 64, className, style }: IlluProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path
      d="M10 31C10 19 20 12 32 12s22 7 22 19H10Z"
      fill="#F2A94B"
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <g fill="#FFF3D6">
      <ellipse cx="24" cy="21" rx="2.2" ry="1.4" transform="rotate(-18 24 21)" />
      <ellipse cx="33" cy="18.5" rx="2.2" ry="1.4" />
      <ellipse cx="42" cy="21" rx="2.2" ry="1.4" transform="rotate(18 42 21)" />
    </g>
    <path
      d="M8 31h48v3.5c-3 4-6 4-9 0s-6 4-9 0-6 4-9 0-6 4-9 0-6 4-9 0-3-4-3-4V31Z"
      fill="#1E9E62"
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path
      d="M11 39h42l-2 5-5-2-5 3.5-5-3.5-5 3.5-5-3.5-5 2-4-3.5-3 2.5Z"
      fill="#FFB627"
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <rect
      x="10"
      y="45"
      width="44"
      height="6"
      rx="3"
      fill="#8A5A2B"
      stroke={INK}
      strokeWidth="3"
    />
    <path
      d="M12 51h40v2.5c0 4.5-4 7.5-9 7.5H21c-5 0-9-3-9-7.5V51Z"
      fill="#F2A94B"
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </svg>
);

export const PizzaSlice = ({ size = 64, className, style }: IlluProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path
      d="M32 57 11 15c14-7 28-7 42 0L32 57Z"
      fill="#FFC24B"
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path
      d="M11 15c14-7 28-7 42 0l-3.5 6.5c-11.5-5.5-23.5-5.5-35 0L11 15Z"
      fill="#E8913F"
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <circle cx="25.5" cy="27" r="4.6" fill="#E23744" stroke={INK} strokeWidth="2.6" />
    <circle cx="38.5" cy="27" r="4.6" fill="#E23744" stroke={INK} strokeWidth="2.6" />
    <circle cx="32" cy="40" r="4.6" fill="#E23744" stroke={INK} strokeWidth="2.6" />
  </svg>
);

export const Fries = ({ size = 64, className, style }: IlluProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <rect
      x="19"
      y="7"
      width="6.5"
      height="27"
      rx="3.2"
      fill="#FFC24B"
      stroke={INK}
      strokeWidth="2.6"
      transform="rotate(-11 22 20)"
    />
    <rect
      x="28.8"
      y="4"
      width="6.5"
      height="30"
      rx="3.2"
      fill="#FFC24B"
      stroke={INK}
      strokeWidth="2.6"
    />
    <rect
      x="38.5"
      y="7"
      width="6.5"
      height="27"
      rx="3.2"
      fill="#FFC24B"
      stroke={INK}
      strokeWidth="2.6"
      transform="rotate(11 42 20)"
    />
    <path
      d="M13 27h38l-4.5 31h-29L13 27Z"
      fill="#E23744"
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path
      d="M13 27h38l-1.2 8H14.2L13 27Z"
      fill="#FFFDF9"
      stroke={INK}
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
  </svg>
);

export const DrinkCup = ({ size = 64, className, style }: IlluProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path
      d="M37 15V7.5h9"
      stroke="#E23744"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="17"
      y="14"
      width="30"
      height="7.5"
      rx="3.7"
      fill="#E23744"
      stroke={INK}
      strokeWidth="2.8"
    />
    <path
      d="M20 21.5h24l-3 36.5H23L20 21.5Z"
      fill="#FFFDF9"
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path
      d="M21.6 31h20.8l-.9 11H22.5l-.9-11Z"
      fill="#FFB627"
      stroke={INK}
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
  </svg>
);

export const Donut = ({ size = 64, className, style }: IlluProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <circle cx="32" cy="32" r="20" fill="#F2A94B" stroke={INK} strokeWidth="3" />
    <path
      d="M32 16.5c8.6 0 15.5 7 15.5 15.5 0 3-1.8 4.4-3.8 4.4-4 0-3.4-4.4-7-4.4s-3.4 5-7.4 5-3.6-4.4-7-4.4c-2 0-3.8-1.4-3.8-4.4C18.5 23.5 23.4 16.5 32 16.5Z"
      fill="#FF8FA3"
      stroke={INK}
      strokeWidth="2.8"
      strokeLinejoin="round"
    />
    <circle cx="32" cy="32" r="5.6" fill="#FFF5EA" stroke={INK} strokeWidth="2.8" />
    <g strokeWidth="2.4" strokeLinecap="round">
      <path d="M25 22.5l3 1.6" stroke="#FFFDF9" />
      <path d="M39.5 23.5l-2.8 2" stroke="#1E9E62" />
      <path d="M24.5 39.5l2.6-2.2" stroke="#3D7DD8" />
      <path d="M40 38l-3-1.4" stroke="#FFFDF9" />
    </g>
  </svg>
);

export const Taco = ({ size = 64, className, style }: IlluProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <circle cx="19" cy="42" r="5" fill="#1E9E62" stroke={INK} strokeWidth="2.6" />
    <circle cx="28" cy="38.5" r="5" fill="#E23744" stroke={INK} strokeWidth="2.6" />
    <circle cx="37" cy="38.5" r="5" fill="#1E9E62" stroke={INK} strokeWidth="2.6" />
    <circle cx="46" cy="42" r="5" fill="#E23744" stroke={INK} strokeWidth="2.6" />
    <path
      d="M9 47a23 23 0 0 1 46 0H9Z"
      fill="#FFC24B"
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <g fill="#E8913F">
      <circle cx="24" cy="40" r="1.6" />
      <circle cx="33" cy="35" r="1.6" />
      <circle cx="41" cy="41" r="1.6" />
    </g>
  </svg>
);

export const SteamBowl = ({ size = 64, className, style }: IlluProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <g stroke={INK} strokeWidth="2.8" strokeLinecap="round">
      <path d="M25 6c-3 3 3 5 0 8" />
      <path d="M37 6c-3 3 3 5 0 8" />
    </g>
    <path
      d="M13 30c2-9 36-9 38 0H13Z"
      fill="#FFF3D6"
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path
      d="M11 30h42c0 13-9 22-21 22S11 43 11 30Z"
      fill="#3D7DD8"
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path d="M18 38c2 5 6 8 11 9" stroke="#FFFDF9" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

export const Scooter = ({ size = 64, className, style }: IlluProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <rect
      x="4"
      y="18"
      width="15"
      height="13"
      rx="2.5"
      fill="#FFB627"
      stroke={INK}
      strokeWidth="2.8"
    />
    <path d="M4 24.5h15" stroke={INK} strokeWidth="2.4" />
    <path
      d="M11.5 31v6.5"
      stroke={INK}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M14 46.5h22l6.5-13H51"
      stroke={INK}
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M51 33.5l4.5-8h4"
      stroke={INK}
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M28 33.5h13l-3-8.5H30l-2 8.5Z"
      fill="#E23744"
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <rect
      x="22"
      y="21.5"
      width="14"
      height="5"
      rx="2.5"
      fill="#221610"
    />
    <circle cx="16" cy="46.5" r="7.5" fill="#FFFDF9" stroke={INK} strokeWidth="3.2" />
    <circle cx="16" cy="46.5" r="2.2" fill={INK} />
    <circle cx="50" cy="46.5" r="7.5" fill="#FFFDF9" stroke={INK} strokeWidth="3.2" />
    <circle cx="50" cy="46.5" r="2.2" fill={INK} />
  </svg>
);

export const Sparkle = ({ size = 24, className, style }: IlluProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path
      d="M32 5c2.8 15 8.5 20.7 23.5 23.5C40.5 31.3 34.8 37 32 53c-2.8-16-8.5-21.7-23.5-24.5C23.5 25.7 29.2 20 32 5Z"
      fill="#FFB627"
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </svg>
);

export const Squiggle = ({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) => (
  <svg
    viewBox="0 0 120 14"
    fill="none"
    className={className}
    style={style}
    aria-hidden="true"
    preserveAspectRatio="none"
  >
    <path
      d="M3 10C20 2 36 14 53 7s34-5 47 2 17-1 17-1"
      stroke="#E23744"
      strokeWidth="5"
      strokeLinecap="round"
    />
  </svg>
);
