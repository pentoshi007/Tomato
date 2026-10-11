import { colors } from "../../design/tokens";

export type MascotMood = "plain" | "happy" | "sad" | "excited";

type MascotProps = {
  mood?: MascotMood;
  size?: number;
  className?: string;
};

export function TomatoMascot({
  mood = "happy",
  size = 120,
  className = "",
}: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* feet */}
      <path
        d="M36 83l-4 8"
        stroke={colors.ink}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M60 83l4 8"
        stroke={colors.ink}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* arms */}
      <path
        d="M19 60Q9 56 7 47"
        stroke={colors.ink}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M77 60Q87 56 89 47"
        stroke={colors.ink}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* body */}
      <circle
        cx="48"
        cy="54"
        r="30"
        fill={colors.tomato}
        stroke={colors.ink}
        strokeWidth="3"
      />
      {/* calyx */}
      <path
        d="M35 27Q39 17 48 22Q57 17 61 27Q55 31.5 48 26Q41 31.5 35 27Z"
        fill={colors.basil}
        stroke={colors.ink}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M48 22V12"
        stroke={colors.ink}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* shine */}
      <path
        d="M26 50a17 17 0 0 1 10-14"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      {mood === "happy" && (
        <>
          <circle cx="38" cy="52" r="3.4" fill={colors.ink} />
          <circle cx="58" cy="52" r="3.4" fill={colors.ink} />
          <path
            d="M40 62q8 8 16 0"
            stroke={colors.ink}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
      {mood === "excited" && (
        <>
          <path
            d="M34 46l7 2M62 46l-7 2"
            stroke={colors.ink}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="38" cy="52" r="3.4" fill={colors.ink} />
          <circle cx="58" cy="52" r="3.4" fill={colors.ink} />
          <ellipse cx="48" cy="64" rx="6.5" ry="7.5" fill={colors.ink} />
          <ellipse cx="48" cy="67.5" rx="3.5" ry="3" fill={colors.tomato} />
        </>
      )}
      {mood === "sad" && (
        <>
          <path
            d="M33 47l8 3M63 47l-8 3"
            stroke={colors.ink}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="38" cy="55" r="3.4" fill={colors.ink} />
          <circle cx="58" cy="55" r="3.4" fill={colors.ink} />
          <path
            d="M40 67q8-7 16 0"
            stroke={colors.ink}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
    </svg>
  );
}
