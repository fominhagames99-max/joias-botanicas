import * as React from "react";
import { createPortal } from "react-dom";
import type { ConveyorDish, SushiConveyorMenuLabels } from "./types";
import { tierStyle } from "./utils";

interface DishDialogProps {
  uid: string;
  item: ConveyorDish;
  index: number;
  total: number;
  labels: SushiConveyorMenuLabels;
  reduced: boolean;
  broken: boolean;
  source: () => DOMRect | null;
  onLift: (lifted: boolean) => void;
  onAdd: () => void;
  onClose: () => void;
}

export function DishDialog({
  uid,
  item,
  index,
  total,
  labels,
  reduced,
  broken,
  source,
  onLift,
  onAdd,
  onClose,
}: DishDialogProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const figureRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const timer = React.useRef(0);
  const closing = React.useRef(false);
  const [shown, setShown] = React.useState(false);
  const [added, setAdded] = React.useState(false);
  const titleId = `${uid}-dish-title`;
  const tier = tierStyle(item.tier);

  React.useLayoutEffect(() => {
    const figure = figureRef.current;
    const from = source();
    closeRef.current?.focus({ preventScroll: true });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    onLift(true);
    let animation: Animation | null = null;
    if (figure && from && !reduced && from.width > 0) {
      const to = figure.getBoundingClientRect();
      const sx = from.width / to.width;
      const sy = from.height / to.height;
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      const rise = Math.min(120, Math.abs(dy) * 0.3 + 40);
      animation = figure.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
          {
            transform: `translate(${dx * 0.42}px, ${dy * 0.42 - rise}px) scale(${((sx + 1) / 2) * 1.05}, ${((sy + 1) / 2) * 1.05}) rotate(${dx > 0 ? -6 : 6}deg)`,
            offset: 0.5,
          },
          { transform: "none" },
        ],
        { duration: 680, easing: "cubic-bezier(.22,.85,.3,1)" }
      );
    }
    const raf = requestAnimationFrame(() => setShown(true));
    return () => {
      cancelAnimationFrame(raf);
      animation?.cancel();
      window.clearTimeout(timer.current);
      document.body.style.overflow = overflow;
      onLift(false);
    };
  }, [source, reduced, onLift]);

  const dismiss = React.useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setShown(false);
    const figure = figureRef.current;
    const to = source();
    if (!figure || !to || reduced || to.width === 0) {
      onClose();
      return;
    }
    const from = figure.getBoundingClientRect();
    const sx = to.width / from.width;
    const sy = to.height / from.height;
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const animation = figure.animate(
      [
        { transform: "none" },
        {
          transform: `translate(${dx * 0.58}px, ${dy * 0.58 - 36}px) scale(${(sx + 1) / 2}, ${(sy + 1) / 2})`,
          offset: 0.55,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
      ],
      { duration: 540, easing: "cubic-bezier(.45,0,.55,1)", fill: "forwards" }
    );
    animation.onfinish = () => onClose();
  }, [source, reduced, onClose]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog || dialog.contains(event.target as Node)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      } else if (event.key === "Tab") {
        const first = dialog.querySelector("button");
        if (first) {
          event.preventDefault();
          (first as HTMLElement).focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dismiss]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dismiss();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [
      ...(dialogRef.current?.querySelectorAll("button") ?? []),
    ].filter((node) => !node.disabled);
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      (last as HTMLElement).focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      (first as HTMLElement).focus();
    }
  };

  const add = () => {
    if (added || closing.current) return;
    onAdd();
    setAdded(true);
    timer.current = window.setTimeout(dismiss, reduced ? 0 : 450);
  };

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-dish-dialog
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 text-foreground sm:p-8"
      onKeyDown={onKeyDown}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity duration-300 motion-reduce:transition-none ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        onClick={dismiss}
      />
      <div className="relative grid w-full max-w-[52rem] items-center gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] sm:gap-10 sm:p-8">
        <div
          aria-hidden="true"
          className={`absolute inset-0 rounded-[2rem] border border-border bg-card shadow-2xl transition-[opacity,scale] duration-300 motion-reduce:transition-none ${
            shown ? "scale-100 opacity-100" : "scale-[0.97] opacity-0"
          }`}
        />
        <button
          ref={closeRef}
          type="button"
          onClick={dismiss}
          className={`absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground outline-none transition-[opacity,color] duration-300 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none ${
            shown ? "opacity-100" : "opacity-0"
          }`}
        >
          {labels.close}
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
          </svg>
        </button>
        <div ref={figureRef} data-dish-figure className="relative mx-auto aspect-square w-full max-w-[min(42vh,22rem)]">
          <span
            aria-hidden="true"
            className="absolute inset-x-[8%] bottom-[-4%] top-[14%] rounded-full bg-black opacity-25 blur-2xl dark:opacity-70"
          />
          {broken ? (
            <span
              aria-hidden="true"
              className="absolute inset-[3%] rounded-full border border-border bg-muted"
            >
              <span className="absolute inset-[30%] rounded-full bg-muted-foreground/25" />
            </span>
          ) : (
            <img
              src={item.image}
              alt={item.name}
              draggable={false}
              className="relative size-full select-none object-contain"
            />
          )}
          <span
            aria-hidden="true"
            className={`absolute -inset-[1.5%] rounded-full border-[3px] ${tier.ring}`}
          />
        </div>
        <div
          className={`relative flex flex-col gap-3 text-center transition-[opacity,translate] delay-150 duration-500 motion-reduce:transition-none sm:text-left ${
            shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          <p className="flex items-center justify-center gap-2 font-mono text-[11px] tracking-[0.2em] text-muted-foreground sm:justify-start">
            <span aria-hidden="true" className={`size-2 rounded-full ${tier.dot}`} />
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
          <h3 id={titleId} className="text-2xl font-medium tracking-tight sm:text-3xl">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          )}
          {item.details && item.details.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {item.details.map((detail) => (
                <li
                  key={detail}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  {detail}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {item.price}
            </p>
            <button
              type="button"
              data-add
              onClick={add}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm outline-none transition-[translate,box-shadow] hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
            >
              {added ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3.5 8.5l3 3 6-7" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M8 3.5v9M3.5 8h9" />
                </svg>
              )}
              {labels.add}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}