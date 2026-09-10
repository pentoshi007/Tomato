import { useEffect, useRef } from "react";
import { useAppContext } from "../context/AppContext";
import { DEMO_INVITE_KEY } from "./config";
import DemoInvite from "./DemoInvite";
import { probeEmptyState } from "./probe";
import { useDemo } from "./useDemo";

const DemoLayer = () => {
  const { isAuth, user, location, loadingLocation } = useAppContext();
  const { active, openInvite } = useDemo();
  const probed = useRef(false);

  useEffect(() => {
    if (active || probed.current) return;
    if (!isAuth || !user?.role) return;
    if (window.sessionStorage.getItem(DEMO_INVITE_KEY)) return;
    if (user.role === "customer" && loadingLocation) return;

    probed.current = true;
    let cancelled = false;
    void probeEmptyState(user.role, location).then((isEmpty) => {
      if (!cancelled && isEmpty) openInvite();
    });
    return () => {
      cancelled = true;
    };
  }, [active, isAuth, user?.role, location, loadingLocation, openInvite]);

  return <DemoInvite />;
};

export default DemoLayer;
