/**
 * Pure geometry helpers for the whiteboard canvas (board coordinates, no DOM).
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  width: number;
  height: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function center(rect: Rect): Point {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/**
 * Where a line from the centre of `rect` towards `target` leaves the rectangle's border.
 * Returns the centre itself when the target lies inside the rectangle (or on its centre).
 */
export function getBorderPoint(rect: Rect, target: Point): Point {
  const c = center(rect);
  const dx = target.x - c.x;
  const dy = target.y - c.y;
  if (dx === 0 && dy === 0) {
    return c;
  }

  const halfW = rect.width / 2;
  const halfH = rect.height / 2;
  // scale factor along the direction vector until one of the borders is hit
  const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  if (scale >= 1) {
    // target lies inside the rectangle
    return c;
  }
  return { x: c.x + dx * scale, y: c.y + dy * scale };
}

/**
 * The two end points of a line connecting the borders of two rectangles.
 */
export function connectRects(
  from: Rect,
  to: Rect,
): { start: Point; end: Point } {
  return {
    start: getBorderPoint(from, center(to)),
    end: getBorderPoint(to, center(from)),
  };
}

/**
 * Bounding box around all rectangles, or undefined if there are none.
 */
export function getBounds(rects: Rect[]): Bounds | undefined {
  if (rects.length === 0) {
    return undefined;
  }
  return rects.reduce(
    (bounds, r) => ({
      minX: Math.min(bounds.minX, r.x),
      minY: Math.min(bounds.minY, r.y),
      maxX: Math.max(bounds.maxX, r.x + r.width),
      maxY: Math.max(bounds.maxY, r.y + r.height),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );
}

function overlaps(a: Rect, b: Rect, margin: number): boolean {
  return (
    a.x < b.x + b.width + margin &&
    a.x + a.width + margin > b.x &&
    a.y < b.y + b.height + margin &&
    a.y + a.height + margin > b.y
  );
}

/**
 * Find a position for a new item of the given size near `preferred`
 * that does not overlap any of the `occupied` rectangles.
 *
 * Tries the preferred position first, then walks a grid of offsets in growing rings around it,
 * so several items added one after another end up next to each other instead of on top of each other.
 */
export function findFreePosition(
  preferred: Point,
  size: { width: number; height: number },
  occupied: Rect[],
  margin = 20,
): Point {
  const step = { x: size.width + margin, y: size.height + margin };
  const isFree = (p: Point) =>
    !occupied.some((o) => overlaps({ ...p, ...size }, o, margin));

  if (isFree(preferred)) {
    return preferred;
  }

  for (let ring = 1; ring < 50; ring++) {
    for (let i = -ring; i <= ring; i++) {
      for (let j = -ring; j <= ring; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== ring) {
          continue; // only the outer ring, the inner ones were already tried
        }
        const candidate = {
          x: preferred.x + i * step.x,
          y: preferred.y + j * step.y,
        };
        if (isFree(candidate)) {
          return candidate;
        }
      }
    }
  }
  return preferred;
}

/**
 * Positions distributed on a circle around a centre, e.g. to place linked records around a card.
 */
export function getPositionsAround(
  centerPoint: Point,
  count: number,
  radius: number,
): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return {
      x: Math.round(centerPoint.x + radius * Math.cos(angle)),
      y: Math.round(centerPoint.y + radius * Math.sin(angle)),
    };
  });
}
