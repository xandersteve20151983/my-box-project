"use client";

import React, { useMemo } from "react";
import PalletSvg from "./PalletSvg";

/**
 * Very small, generic renderer:
 * - Places `bundles` into a rows/cols grid that roughly squares the layout
 * - Tries to use bundle size (ffLength x ffWidth) and scales it to fit the pallet
 * - If it doesn't fit, it tries the rotated orientation
 */
export default function PatternRenderer({
  pattern,              // { code, bundles }
  ffLength,
  ffWidth,
  palletLength = 1165,
  palletWidth = 1165,
  envelope,             // not used yet, but kept so your API stays stable
}) {
  const { rects, vb, note } = useMemo(() => {
    const bundles = Math.max(1, Number(pattern?.bundles ?? 1));

    // choose grid cols/rows that is visually pleasing (square-ish)
    const cols = Math.ceil(Math.sqrt(bundles));
    const rows = Math.ceil(bundles / cols);

    // We will try TWO orientations:
    //  O1: bundle length along pallet length (X), width along pallet width (Y)
    //  O2: bundle width along pallet length, length along pallet width
    const tryLayout = (bundleX, bundleY) => {
      const usedX = cols * bundleX;
      const usedY = rows * bundleY;
      const sx = palletLength / usedX;
      const sy = palletWidth / usedY;
      const scale = Math.min(sx, sy);

      // final bundle size after scaling to fit the pallet
      return {
        scale,
        bx: bundleX * scale,
        by: bundleY * scale,
      };
    };

    const o1 = tryLayout(ffLength, ffWidth);
    const o2 = tryLayout(ffWidth, ffLength);

    // Pick the orientation that lets us scale bundles larger (nicer visual)
    const best = o1.scale >= o2.scale
      ? { bx: o1.bx, by: o1.by, rotated: false }
      : { bx: o2.bx, by: o2.by, rotated: true };

    // leave a small margin around the pallet drawing space
    const margin = Math.min(palletLength, palletWidth) * 0.02;

    // Center the packed bundles on the pallet
    const usedW = cols * best.bx;
    const usedH = rows * best.by;
    const offX = (palletLength - usedW) / 2;
    const offY = (palletWidth - usedH) / 2;

    // Build rectangles (x,y,w,h) for every bundle
    const rects = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (idx >= bundles) break;
        rects.push({
          x: offX + c * best.bx,
          y: offY + r * best.by,
          w: best.bx,
          h: best.by,
        });
      }
    }

    // ViewBox with a little breathing room
    const vb = {
      x: -margin,
      y: -margin,
      w: palletLength + margin * 2,
      h: palletWidth + margin * 2,
    };

    const note = best.rotated ? "rotated" : "normal";
    return { rects, vb, note };
  }, [pattern, ffLength, ffWidth, palletLength, palletWidth, envelope]);

  return (
    <PalletSvg
      rects={rects}
      palletLength={palletLength}
      palletWidth={palletWidth}
      viewBox={vb}
      meta={{
        code: pattern?.code,
        ff: [ffLength, ffWidth],
      }}
      ariaLabel={`${pattern?.code} – ${pattern?.bundles} bundles/layer`}
    />
  );
}
