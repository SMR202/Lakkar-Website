"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function CollectionRail({
  children,
  resetKey,
  count,
}: {
  children: ReactNode;
  resetKey: string;
  count: number;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    start: true,
    end: true,
    overflow: false,
  });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: "instant" });
    const update = () =>
      setPosition({
        start: el.scrollLeft < 2,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
        overflow: el.scrollWidth > el.clientWidth + 2,
      });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [resetKey, count]);

  function move(direction: number) {
    const el = rail.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card
      ? card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0")
      : el.clientWidth;
    el.scrollBy({
      left: direction * step,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <div className="collection-rail">
      <div className="collection-rail-toolbar">
        <p>
          {count} {count === 1 ? "piece" : "pieces"}
          <span aria-hidden="true"> · </span>
          <span>
            {position.overflow ? "Scroll to explore" : "Explore the collection"}
          </span>
        </p>
        {position.overflow && (
          <div className="rail-controls" aria-label="Collection navigation">
            <button
              type="button"
              aria-label="Previous pieces"
              aria-controls="collection-rail"
              disabled={position.start}
              onClick={() => move(-1)}
            >
              <ArrowLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Next pieces"
              aria-controls="collection-rail"
              disabled={position.end}
              onClick={() => move(1)}
            >
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
      <div
        id="collection-rail"
        className="product-grid"
        ref={rail}
        role="region"
        aria-label="Furniture collection"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            move(e.key === "ArrowRight" ? 1 : -1);
          }
          if (e.key === "Home" || e.key === "End") {
            e.preventDefault();
            e.currentTarget.scrollTo({
              left: e.key === "Home" ? 0 : e.currentTarget.scrollWidth,
              behavior: "instant",
            });
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
