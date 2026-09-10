import { BiJoystick, BiX } from "react-icons/bi";
import { useAppContext } from "../context/AppContext";
import { personaLabel } from "./personas";
import { useDemo } from "./useDemo";

const DemoChip = () => {
  const { isAuth, user } = useAppContext();
  const { active, role, openInvite, exit } = useDemo();

  if (!isAuth || !user?.role) return null;

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => openInvite()}
        className="chip cursor-pointer bg-butter shadow-pop-xs transition-transform hover:-translate-0.5"
      >
        <BiJoystick className="h-4 w-4 text-tomato" />
        <span className="hidden xs:inline">Demo</span>
      </button>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink bg-mustard py-1 pr-1 pl-2.5 shadow-pop-xs">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping-dot absolute inset-0 rounded-full bg-tomato" />
        <span className="h-2 w-2 rounded-full border border-ink bg-tomato" />
      </span>
      <button
        type="button"
        onClick={() => openInvite()}
        title="Switch demo persona"
        className="cursor-pointer text-[11px] font-black tracking-wide uppercase"
      >
        Demo
        <span className="hidden sm:inline"> · {personaLabel(role)}</span>
      </button>
      <button
        type="button"
        onClick={exit}
        aria-label="Exit demo mode"
        title="Exit demo mode"
        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-paper transition-colors hover:bg-blush"
      >
        <BiX className="h-3.5 w-3.5" />
      </button>
    </span>
  );
};

export default DemoChip;
