import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Returns an array where rowIndices[i] is the row number (0-based)
 * of the i-th child of the container.
 */
export function useRowIndices(containerRef: React.RefObject<HTMLDivElement | null | undefined>) {
  const [rowIndices, setRowIndices] = useState<number[]>([]);
  const rafRef = useRef<number | null>(null);

  const measure = () => {
    if (!containerRef.current) return;
    const children = Array.from(containerRef.current.children) as HTMLDivElement[];
    if (children.length === 0) {
      setRowIndices([]);
      return;
    }

    // group by offsetTop → rows
    const tops = children.map((el) => el.offsetTop);
    // create a stable list of unique tops in document order
    const uniqueTops: number[] = [];
    for (const t of tops) if (!uniqueTops.includes(t)) uniqueTops.push(t);

    // map each child to its row index
    const rows = tops.map((t) => uniqueTops.indexOf(t));
    setRowIndices(rows);
  };

  // measure after layout/paint
  useLayoutEffect(() => {
    rafRef.current = requestAnimationFrame(measure);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // re-measure on resize
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);

    // re-measure when children change (add/remove/order)
    const mo = new MutationObserver(measure);
    mo.observe(containerRef.current, { childList: true, subtree: false });

    // also re-measure on window resize (fonts, breakpoints)
    const onWinResize = () => measure();
    window.addEventListener("resize", onWinResize);

    // initial (in case layout effect missed content late-load)
    measure();

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", onWinResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef.current]);

  return rowIndices;
}
