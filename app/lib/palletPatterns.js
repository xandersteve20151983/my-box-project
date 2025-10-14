// lib/palletPatterns.js
/**
 * Pattern schema:
 * id: string (e.g. "5B1")
 * name: string (display)
 * bundlesPerLayer: number
 * thumb: PNG path under /public/pallet-patterns/
 * layout: array of rectangles (fractions of the pallet footprint)
 *    - x,y,w,h are 0..1 in pallet coords; rot = 0 or 90 (deg)
 *
 * NOTE: The layout is used only for the scalable renderer.
 * For the admin list, only id, thumb, bundlesPerLayer are needed.
 */
export const palletPatterns = [
  {
    id: "4B1",
    name: "4B1",
    bundlesPerLayer: 4,
    thumb: "/pallet-patterns/4B1.png",
    layout: [
      { x: 0.00, y: 0.00, w: 0.50, h: 0.50, rot: 0 },
      { x: 0.50, y: 0.00, w: 0.50, h: 0.50, rot: 0 },
      { x: 0.00, y: 0.50, w: 0.50, h: 0.50, rot: 0 },
      { x: 0.50, y: 0.50, w: 0.50, h: 0.50, rot: 0 },
    ],
  },
  {
    id: "5B1",
    name: "5B1",
    bundlesPerLayer: 5,
    thumb: "/pallet-patterns/5B1.png",
    layout: [
      // 3 top across + 2 bottom across (simple example)
      { x: 0.00, y: 0.00, w: 1/3, h: 0.5, rot: 0 },
      { x: 1/3, y: 0.00, w: 1/3, h: 0.5, rot: 0 },
      { x: 2/3, y: 0.00, w: 1/3, h: 0.5, rot: 0 },
      { x: 0.00, y: 0.50, w: 0.5, h: 0.5, rot: 0 },
      { x: 0.50, y: 0.50, w: 0.5, h: 0.5, rot: 0 },
    ],
  },
  {
    id: "6B1",
    name: "6B1",
    bundlesPerLayer: 6,
    thumb: "/pallet-patterns/6B1.png",
    layout: [
      { x: 0.00, y: 0.00, w: 1/3, h: 0.5, rot: 0 },
      { x: 1/3, y: 0.00, w: 1/3, h: 0.5, rot: 0 },
      { x: 2/3, y: 0.00, w: 1/3, h: 0.5, rot: 0 },
      { x: 0.00, y: 0.50, w: 1/3, h: 0.5, rot: 0 },
      { x: 1/3, y: 0.50, w: 1/3, h: 0.5, rot: 0 },
      { x: 2/3, y: 0.50, w: 1/3, h: 0.5, rot: 0 },
    ],
  },
];

/** Quick lookup by id */
export const findPattern = (id) => palletPatterns.find(p => p.id === id);
