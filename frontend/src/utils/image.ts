// Rewrites Cloudinary delivery URLs to request a right-sized, auto-format
// variant. Falls back to the original URL for non-Cloudinary hosts.
export const optimizeImage = (
  url: string | undefined,
  width = 800,
): string | undefined => {
  if (!url) return undefined;
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
};
