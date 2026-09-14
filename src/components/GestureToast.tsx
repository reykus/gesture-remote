import type { GestureAction } from "../gestureEngine";

const copy: Record<GestureAction, string> = {
  next: "Next →",
  prev: "← Previous",
  blackout: "Blackout toggled",
};

type Props = {
  action: { type: GestureAction; key: number } | null;
};

export function GestureToast({ action }: Props) {
  if (!action) return null;
  return (
    <div className="gesture-toast" key={action.key}>
      {copy[action.type]}
    </div>
  );
}
