import { colors } from "../../design/tokens";

export type CuisineIconProps = { className?: string };

const stroke = {
  stroke: colors.ink,
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function PizzaIcon({ className = "" }: CuisineIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 21 4.8 7.2A10.4 4.6 0 0 1 19.2 7.2L12 21Z"
        fill={colors.butter}
        {...stroke}
      />
      <path
        d="M12 17.6 7.6 8.4a7.6 3.2 0 0 1 8.8 0L12 17.6Z"
        fill={colors.tomato}
        stroke={colors.ink}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10.2" cy="9.8" r="1" fill={colors.basil} />
      <circle cx="13.8" cy="11" r="1" fill={colors.basil} />
    </svg>
  );
}

export function BurgerIcon({ className = "" }: CuisineIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 10.5Q5 5 12 5t7 5.5Z" fill={colors.butter} {...stroke} />
      <circle cx="9.5" cy="7.8" r="0.55" fill={colors.ink} />
      <circle cx="12.5" cy="7.2" r="0.55" fill={colors.ink} />
      <circle cx="14.8" cy="8.2" r="0.55" fill={colors.ink} />
      <path
        d="M5 13.8c1.2 1 2.3-1 3.5 0s2.3-1 3.5 0 2.3-1 3.5 0 2.3-1 3.5 0"
        stroke={colors.basil}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <rect
        x="5"
        y="15.2"
        width="14"
        height="3"
        rx="1.5"
        fill={colors.tomato}
        stroke={colors.ink}
        strokeWidth="1.6"
      />
      <path
        d="M5 19h14v.8a3 3 0 0 1-3 2.2H8a3 3 0 0 1-3-2.2Z"
        fill={colors.butter}
        {...stroke}
      />
    </svg>
  );
}

export function CurryIcon({ className = "" }: CuisineIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8.6 9.2q1.2-1.4 0-3" {...stroke} strokeWidth="1.6" fill="none" />
      <path d="M12 9.2q1.2-1.4 0-3" {...stroke} strokeWidth="1.6" fill="none" />
      <path d="M15.4 9.2q1.2-1.4 0-3" {...stroke} strokeWidth="1.6" fill="none" />
      <path
        d="M4.5 12h15q0 6.5-5.5 7.5h-4Q4.5 18.5 4.5 12Z"
        fill={colors.butter}
        {...stroke}
      />
    </svg>
  );
}

export function BiryaniIcon({ className = "" }: CuisineIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7.5 11.5q4.5-4 9 0"
        fill={colors.paper}
        stroke={colors.ink}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10.2" r="0.5" fill={colors.ink} />
      <circle cx="12" cy="9.4" r="0.5" fill={colors.ink} />
      <circle cx="14" cy="10.2" r="0.5" fill={colors.ink} />
      <path
        d="M4.5 12h15q0 6.5-5.5 7.5h-4Q4.5 18.5 4.5 12Z"
        fill={colors.tomato}
        {...stroke}
      />
    </svg>
  );
}

export function NoodlesIcon({ className = "" }: CuisineIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M14 3l5.5 6" {...stroke} strokeWidth="1.6" />
      <path d="M16.5 2 21 6.5" {...stroke} strokeWidth="1.6" />
      <path d="M7 8.5q-1 2 0 4" {...stroke} strokeWidth="1.5" fill="none" />
      <path d="M10 8.5q-1 2 0 4" {...stroke} strokeWidth="1.5" fill="none" />
      <path d="M13 8.5q-1 2 0 4" {...stroke} strokeWidth="1.5" fill="none" />
      <path
        d="M4.5 13h15q0 6.5-5.5 7.5h-4Q4.5 19.5 4.5 13Z"
        fill={colors.butter}
        {...stroke}
      />
    </svg>
  );
}

export function DosaIcon({ className = "" }: CuisineIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4.5 17.5 11 4.5q5 4.5 4.2 9.2-.8 4.2-10.7 3.8Z"
        fill={colors.butter}
        {...stroke}
      />
      <path
        d="M7 15 10.5 8q2.5 2.5 2.2 5.7Z"
        fill={colors.tomato}
        stroke={colors.ink}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="18" r="2.6" fill={colors.basil} {...stroke} />
    </svg>
  );
}

export function CoffeeIcon({ className = "" }: CuisineIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M9 4.5q1-1.1 0-2.2" {...stroke} strokeWidth="1.5" fill="none" />
      <path d="M12.5 4.5q1-1.1 0-2.2" {...stroke} strokeWidth="1.5" fill="none" />
      <path
        d="M5 7h11v5.5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 12.5Z"
        fill={colors.paper}
        {...stroke}
      />
      <path d="M16 8.5h1.2a2.6 2.6 0 0 1 0 5.2H16" {...stroke} fill="none" />
      <path d="M4.5 20.5h12" {...stroke} />
    </svg>
  );
}

export function DessertIcon({ className = "" }: CuisineIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8.8 10.5 12 21.5l3.2-11Z" fill={colors.butter} {...stroke} />
      <path d="M10 14h4M10.8 16.5h2.4" stroke={colors.ink} strokeWidth="1" />
      <circle cx="12" cy="7" r="4.2" fill={colors.basil} {...stroke} />
      <circle
        cx="12"
        cy="2.2"
        r="1.1"
        fill={colors.tomato}
        stroke={colors.ink}
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function SaladIcon({ className = "" }: CuisineIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8.8 12.2q-3.2-.8-2.6-4 3 .6 2.6 4Z"
        fill={colors.basil}
        stroke={colors.ink}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M15.2 12.2q3.2-.8 2.6-4-3 .6-2.6 4Z"
        fill={colors.basil}
        stroke={colors.ink}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="1.9" fill={colors.tomato} {...stroke} strokeWidth="1.5" />
      <path
        d="M4.5 13h15q0 6.5-5.5 7.5h-4Q4.5 19.5 4.5 13Z"
        fill={colors.paper}
        {...stroke}
      />
    </svg>
  );
}

export function WrapIcon({ className = "" }: CuisineIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <g transform="rotate(-35 12 12)">
        <rect
          x="4.5"
          y="9"
          width="15"
          height="6"
          rx="3"
          fill={colors.butter}
          {...stroke}
        />
        <path d="M15.5 9.8v4.4" stroke={colors.tomato} strokeWidth="2" strokeLinecap="round" />
        <circle
          cx="17.2"
          cy="12"
          r="1.4"
          fill={colors.paper}
          stroke={colors.ink}
          strokeWidth="1.2"
        />
      </g>
    </svg>
  );
}

export function UtensilsIcon({ className = "" }: CuisineIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6.5 3.5v3.5M8.5 3.5v3.5M7.5 3.5v17"
        {...stroke}
        strokeWidth="1.7"
      />
      <path d="M6.5 7q1 1.5 2 0" {...stroke} strokeWidth="1.5" fill="none" />
      <ellipse
        cx="16.5"
        cy="6.3"
        rx="2"
        ry="2.9"
        fill={colors.butter}
        {...stroke}
        strokeWidth="1.7"
      />
      <path d="M16.5 9.2v11.3" {...stroke} strokeWidth="1.7" />
    </svg>
  );
}
