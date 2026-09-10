import { useEffect, useState } from "react";
import { BiPlay, BiX } from "react-icons/bi";
import { Sparkle } from "../components/ui/illustrations";
import { useAppContext } from "../context/AppContext";
import { PERSONAS } from "./personas";
import type { DemoRole } from "./types";
import { useDemo } from "./useDemo";

const toDemoRole = (role: string | undefined): DemoRole =>
  role === "seller" || role === "rider" ? role : "customer";

const DemoInviteDialog = () => {
  const { user, location } = useAppContext();
  const { active, role, inviteReason, closeInvite, enter } = useDemo();
  const [selected, setSelected] = useState<DemoRole>(() =>
    toDemoRole(role ?? user?.role),
  );

  const headline =
    active
      ? "Switch your demo persona"
      : inviteReason === "no-restaurants"
        ? "No kitchens near you yet"
        : inviteReason === "empty-workspace"
          ? "Nothing here yet — want a tour?"
          : "Explore Tomato in demo mode";
  const subline =
    inviteReason === "no-restaurants"
      ? "Tomato hasn't reached your neighbourhood yet. Jump into demo mode to browse sample kitchens, order food, run a restaurant and ride deliveries — every feature, no real money."
      : "Explore Tomato with sample kitchens, dishes and orders that move on their own. Your real account stays untouched.";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeInvite();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeInvite]);

  const start = () => {
    enter(selected, {
      userId: user?._id ?? "demo-user",
      userName: user?.name ?? "Demo Explorer",
      origin: location,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/55 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={closeInvite}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-invite-title"
        onClick={(event) => event.stopPropagation()}
        className="card animate-pop-in max-h-[92dvh] w-full max-w-2xl overflow-y-auto !rounded-b-none sm:!rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b-2 border-ink bg-mustard p-5 sm:p-6">
          <div>
            <span className="sticker bg-paper">
              <Sparkle size={13} /> Guided demo
            </span>
            <h2
              id="demo-invite-title"
              className="font-display mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl"
            >
              {headline}
            </h2>
            <p className="mt-1.5 max-w-lg text-sm font-semibold text-ink/70">
              {subline}
            </p>
          </div>
          <button
            type="button"
            onClick={closeInvite}
            aria-label="Close demo invitation"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-paper shadow-pop-xs transition-transform hover:-translate-0.5"
          >
            <BiX className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
          {PERSONAS.map(({ role: persona, title, blurb, Icon, bg }) => {
            const isSelected = selected === persona;
            return (
              <button
                key={persona}
                type="button"
                onClick={() => setSelected(persona)}
                aria-pressed={isSelected}
                className={`${bg} cursor-pointer rounded-2xl border-2 border-ink p-4 text-left transition-all ${
                  isSelected
                    ? "-translate-0.5 shadow-pop"
                    : "shadow-pop-xs hover:-translate-0.5 hover:shadow-pop-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <Icon size={44} />
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-ink ${
                      isSelected ? "bg-tomato" : "bg-paper"
                    }`}
                  >
                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </div>
                <h3 className="font-display mt-3 text-base font-bold">
                  {title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed font-medium text-ink/70">
                  {blurb}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2.5 border-t-2 border-ink bg-cream p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="text-xs font-bold text-smoke">
            Exit any time from the Demo badge in the header.
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={closeInvite}
              className="btn-ghost !py-2.5 !text-xs"
            >
              Maybe later
            </button>
            <button type="button" onClick={start} className="btn-primary !py-2.5">
              <BiPlay className="h-4 w-4" />
              {active ? "Switch persona" : "Enter demo mode"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DemoInvite = () => {
  const { inviteOpen } = useDemo();
  if (!inviteOpen) return null;
  return <DemoInviteDialog />;
};

export default DemoInvite;
