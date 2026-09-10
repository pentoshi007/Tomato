interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  wordmarkClassName?: string;
  className?: string;
}

export const TomatoMark = ({ size = 36 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden="true"
  >
    <circle
      cx="24"
      cy="27"
      r="17"
      fill="#E23744"
      stroke="#221610"
      strokeWidth="3"
    />
    <path
      d="M24 10c-.6-2.6.8-4.6 3-5.6"
      stroke="#221610"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M24 12.5c-2.5-3-7-3.4-9.6-1.4 2.3 1 4.4 1.6 9.6 1.4Z"
      fill="#1E9E62"
      stroke="#221610"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
    <path
      d="M24 12.5c2.5-3 7-3.4 9.6-1.4-2.3 1-4.4 1.6-9.6 1.4Z"
      fill="#1E9E62"
      stroke="#221610"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
    <ellipse
      cx="17"
      cy="21.5"
      rx="4.2"
      ry="2.6"
      fill="#FF9D92"
      transform="rotate(-32 17 21.5)"
    />
  </svg>
);

export const Logo = ({
  size = 36,
  withWordmark = true,
  wordmarkClassName = "",
  className = "",
}: LogoProps) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <TomatoMark size={size} />
    {withWordmark && (
      <span
        className={`font-display leading-none font-extrabold tracking-tight text-ink lowercase ${wordmarkClassName}`}
        style={{ fontSize: size * 0.72 }}
      >
        tomato
      </span>
    )}
  </span>
);
