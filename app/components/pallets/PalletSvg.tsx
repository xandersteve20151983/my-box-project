import React from "react";

type Rect = { x: number; y: number; w: number; h: number };

type Props = {
  palletLength: number;
  palletWidth: number;
  rects: Rect[];
  viewBox?: { x: number; y: number; w: number; h: number };
  meta?: { code?: string; ff?: [number, number] };
  ariaLabel?: string;
};

export default function PalletSvg({
  palletLength,
  palletWidth,
  rects,
  viewBox = { x: 0, y: 0, w: palletLength, h: palletWidth },
  meta,
  ariaLabel,
}: Props) {
  const slot = Math.min(palletLength, palletWidth) * 0.08;
  const slotGap = slot * 0.6;

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
      width="100%"
      height="100%"
      style={{ display: "block" }}
    >
      {/* pallet outline */}
      <rect
        x={0}
        y={0}
        width={palletLength}
        height={palletWidth}
        fill="#f8fafc"
        stroke="#cbd5e1"
        strokeWidth={2}
        rx={10}
        ry={10}
      />

      {/* forklift channels */}
      <g fill="#e2e8f0">
        <rect
          x={slotGap}
          y={palletWidth * 0.12}
          width={palletLength - slotGap * 2}
          height={slot}
          rx={6}
        />
        <rect
          x={slotGap}
          y={palletWidth - slot - palletWidth * 0.12}
          width={palletLength - slotGap * 2}
          height={slot}
          rx={6}
        />
      </g>

      {/* bundle rectangles */}
      <g>
        {rects.map((r, i) => (
          <rect
            key={i}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill="#ffffff"
            stroke="#64748b"
            strokeWidth={2}
            rx={4}
            ry={4}
          />
        ))}
      </g>

      {/* coordinate axis lines */}
      <g stroke="#e5e7eb" strokeWidth={1}>
        <line x1={0} y1={0} x2={palletLength} y2={0} />
        <line x1={0} y1={0} x2={0} y2={palletWidth} />
      </g>

      {/* code label */}
      {meta?.code ? (
        <text
          x={8}
          y={16}
          fontSize={12}
          fill="#334155"
          style={{ userSelect: "none" }}
        >
          {meta.code}
        </text>
      ) : null}
    </svg>
  );
}
