import { useState } from "react";
import { optimizeImage } from "../../utils/image";
import { SteamBowl } from "./illustrations";

interface FoodImageProps {
  src?: string;
  alt: string;
  width?: number;
  className?: string;
  eager?: boolean;
}

// Optimized, lazily-loaded food image with an illustrated fallback tile.
export const FoodImage = ({
  src,
  alt,
  width = 800,
  className = "",
  eager = false,
}: FoodImageProps) => {
  const [failed, setFailed] = useState(false);
  const url = optimizeImage(src, width);

  if (!url || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-butter ${className}`}
        role="img"
        aria-label={alt}
      >
        <SteamBowl size={56} />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
