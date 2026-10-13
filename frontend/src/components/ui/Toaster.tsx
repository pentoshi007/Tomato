import { Toaster as HotToaster } from "react-hot-toast";
import { colors } from "../../design/tokens";

/** Brand-styled toast host — mount once per app shell. */
export function BrandToaster() {
  return (
    <HotToaster
      position="top-center"
      gutter={8}
      toastOptions={{
        duration: 3500,
        style: {
          background: colors.paper,
          color: colors.ink,
          border: `2px solid ${colors.ink}`,
          borderRadius: "14px",
          boxShadow: `4px 4px 0 ${colors.ink}`,
          fontWeight: 600,
          fontFamily: "'Figtree Variable', system-ui, sans-serif",
          padding: "10px 14px",
          maxWidth: "420px",
        },
        success: { iconTheme: { primary: colors.basil, secondary: colors.paper } },
        error: {
          iconTheme: { primary: colors.tomatoDeep, secondary: colors.paper },
        },
      }}
    />
  );
}
