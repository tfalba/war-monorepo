import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Returns an array where colIndices[i] is the column number (0-based)
 * of the i-th child inside a flex-wrap container.
 *
 * Works by grouping children by offsetTop (rows), then sorting each row by offsetLeft.
 */
export function useColumnIndices(containerRef: React.RefObject<HTMLDivElement | null | undefined>) {
  const [colIndices, setColIndices] = useState<number[]>([]);
  const rafRef = useRef<number | null>(null);

  const measure = () => {
    const container = containerRef.current;
    if (!container) return;

    const children = Array.from(container.children) as HTMLDivElement[];
    if (children.length === 0) {
      setColIndices([]);
      return;
    }

    // 1) Collect tops and lefts
    const tops = children.map((el) => el.offsetTop);
    const lefts = children.map((el) => el.offsetLeft);

    // 2) Stable list of unique row tops in visual order
    const uniqueTops: number[] = [];
    for (const t of tops) if (!uniqueTops.includes(t)) uniqueTops.push(t);

    // 3) Build a map: rowTop -> indices of children in that row
    const rowMap = new Map<number, number[]>();
    uniqueTops.forEach((t) => rowMap.set(t, []));
    tops.forEach((t, i) => rowMap.get(t)!.push(i));

    // 4) For each row, sort children by offsetLeft and assign column indices
    const result = new Array(children.length).fill(0);
    for (const [rowTop, idxs] of rowMap.entries()) {
      const sortedByLeft = idxs.sort((i, j) => lefts[i] - lefts[j]);
      sortedByLeft.forEach((childIndex, col) => {
        result[childIndex] = col;
      });
    }

    setColIndices(result);
  };

  // initial measure after layout
  useLayoutEffect(() => {
    rafRef.current = requestAnimationFrame(measure);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-measure on size/children changes & window resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(measure);
    ro.observe(container);

    const mo = new MutationObserver(measure);
    mo.observe(container, { childList: true, subtree: false });

    window.addEventListener("resize", measure);
    measure();

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef.current]);

  return colIndices;
}
