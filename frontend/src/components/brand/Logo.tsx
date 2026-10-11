import { colors } from "../../design/tokens";

type GlyphProps = {
  size?: number;
  className?: string;
};

export function TomatoGlyph({ size = 32, className = "" }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="24"
        cy="28"
        r="16.5"
        fill={colors.tomato}
        stroke={colors.ink}
        strokeWidth="2.5"
      />
      <path
        d="M17 13.5Q19.5 8.5 24 11.5Q28.5 8.5 31 13.5Q28 16 24 15.5Q20 16 17 13.5Z"
        fill={colors.basil}
        stroke={colors.ink}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M24 11.5V6.5"
        stroke={colors.ink}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M13.5 24a11 11 0 0 1 6.5-6.5"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({
  size = 32,
  wordmarkClass = "text-2xl",
  className = "",
}: GlyphProps & { wordmarkClass?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <TomatoGlyph size={size} />
      <span
        className={`font-display font-extrabold tracking-tight text-ink ${wordmarkClass}`}
      >
        Tomato
      </span>
    </span>
  );
}
