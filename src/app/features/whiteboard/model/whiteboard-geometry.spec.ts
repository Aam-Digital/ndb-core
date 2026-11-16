import {
  connectRects,
  findFreePosition,
  getBorderPoint,
  getBounds,
  getPositionsAround,
  Rect,
} from "./whiteboard-geometry";

describe("whiteboard geometry", () => {
  const rect: Rect = { x: 100, y: 100, width: 200, height: 100 };

  it.each([
    ["right", { x: 500, y: 150 }, { x: 300, y: 150 }],
    ["left", { x: -100, y: 150 }, { x: 100, y: 150 }],
    ["below", { x: 200, y: 400 }, { x: 200, y: 200 }],
    ["above", { x: 200, y: -100 }, { x: 200, y: 100 }],
    ["diagonal (hits the top edge)", { x: 250, y: -100 }, { x: 210, y: 100 }],
  ])(
    "leaves the rectangle at its border towards a target %s of it",
    (_, target, expected) => {
      expect(getBorderPoint(rect, target)).toEqual(expected);
    },
  );

  it("falls back to the centre when the target lies inside the rectangle", () => {
    expect(getBorderPoint(rect, { x: 220, y: 130 })).toEqual({
      x: 200,
      y: 150,
    });
    expect(getBorderPoint(rect, { x: 200, y: 150 })).toEqual({
      x: 200,
      y: 150,
    });
  });

  it("connects two rectangles from border to border", () => {
    const other: Rect = { x: 500, y: 100, width: 200, height: 100 };
    expect(connectRects(rect, other)).toEqual({
      start: { x: 300, y: 150 },
      end: { x: 500, y: 150 },
    });
  });

  it("calculates the bounding box of several rectangles", () => {
    expect(
      getBounds([rect, { x: -50, y: 300, width: 10, height: 10 }]),
    ).toEqual({ minX: -50, minY: 100, maxX: 300, maxY: 310 });
    expect(getBounds([])).toBeUndefined();
  });

  describe("findFreePosition", () => {
    const size = { width: 100, height: 50 };

    it("keeps the preferred position when nothing overlaps", () => {
      expect(findFreePosition({ x: 0, y: 0 }, size, [])).toEqual({
        x: 0,
        y: 0,
      });
      expect(
        findFreePosition({ x: 0, y: 0 }, size, [
          { x: 500, y: 500, width: 10, height: 10 },
        ]),
      ).toEqual({ x: 0, y: 0 });
    });

    it("moves to a neighbouring free spot when the preferred position is occupied", () => {
      const occupied = [{ x: 0, y: 0, ...size }];
      const position = findFreePosition({ x: 0, y: 0 }, size, occupied);

      expect(position).not.toEqual({ x: 0, y: 0 });
      // the found spot does not overlap (including margin)
      expect(
        Math.abs(position.x) >= size.width + 20 ||
          Math.abs(position.y) >= size.height + 20,
      ).toBe(true);
    });

    it("places several items added one after another next to each other", () => {
      const occupied: Rect[] = [];
      for (let i = 0; i < 4; i++) {
        occupied.push({
          ...findFreePosition({ x: 0, y: 0 }, size, occupied),
          ...size,
        });
      }
      const positions = occupied.map(({ x, y }) => `${x},${y}`);
      expect(new Set(positions).size).toBe(4);
    });
  });

  it("distributes positions evenly around a centre", () => {
    const positions = getPositionsAround({ x: 0, y: 0 }, 4, 100);
    expect(positions).toEqual([
      { x: 0, y: -100 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
      { x: -100, y: 0 },
    ]);
  });
});
