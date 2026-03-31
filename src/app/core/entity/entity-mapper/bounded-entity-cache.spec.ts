import { BoundedEntityCache } from "./bounded-entity-cache";

describe("BoundedEntityCache", () => {
  let cache: BoundedEntityCache;

  beforeEach(() => {
    cache = new BoundedEntityCache(5);
  });

  it("get() returns undefined for missing entries", () => {
    expect(cache.get("Child:", "Child:1")).toBeUndefined();
  });

  it("set() and get() store and retrieve a record", () => {
    const record = { _id: "Child:1", name: "Alice" };
    cache.set("Child:", "Child:1", record);

    expect(cache.get("Child:", "Child:1")).toBe(record);
  });

  it("set() overwrites existing record for same id", () => {
    cache.set("Child:", "Child:1", { _id: "Child:1", name: "old" });
    const updated = { _id: "Child:1", name: "new" };
    cache.set("Child:", "Child:1", updated);

    expect(cache.get("Child:", "Child:1")).toBe(updated);
  });

  it("getAll() returns all records for a prefix", () => {
    cache.set("Child:", "Child:1", { _id: "Child:1" });
    cache.set("Child:", "Child:2", { _id: "Child:2" });
    cache.set("School:", "School:1", { _id: "School:1" });

    const children = cache.getAll("Child:");
    expect(children).toHaveLength(2);
    expect(children.map((r) => r._id)).toEqual(
      expect.arrayContaining(["Child:1", "Child:2"]),
    );
  });

  it("getAll() returns empty array for unknown prefix", () => {
    expect(cache.getAll("Unknown:")).toEqual([]);
  });

  it("delete() removes a record", () => {
    cache.set("Child:", "Child:1", { _id: "Child:1" });
    cache.delete("Child:", "Child:1");

    expect(cache.get("Child:", "Child:1")).toBeUndefined();
    expect(cache.getAll("Child:")).toHaveLength(0);
  });

  it("delete() is a no-op for missing entries", () => {
    cache.delete("Child:", "Child:1");
    expect(cache.getAll("Child:")).toHaveLength(0);
  });

  it("setMany() inserts multiple records at once", () => {
    const records = [
      { _id: "Child:1", name: "A" },
      { _id: "Child:2", name: "B" },
    ];
    cache.setMany("Child:", records);

    expect(cache.get("Child:", "Child:1")).toBe(records[0]);
    expect(cache.get("Child:", "Child:2")).toBe(records[1]);
  });

  it("setMany() with markFullyLoaded marks the prefix as fully loaded", () => {
    cache.setMany("Child:", [{ _id: "Child:1" }], true);
    expect(cache.isFullyLoaded("Child:")).toBe(true);
  });

  it("isFullyLoaded() returns false for unknown prefix", () => {
    expect(cache.isFullyLoaded("Child:")).toBe(false);
  });

  it("markFullyLoaded() marks a prefix as fully loaded", () => {
    cache.markFullyLoaded("Child:");
    expect(cache.isFullyLoaded("Child:")).toBe(true);
  });

  describe("eviction", () => {
    it("clears all data when size exceeds maxSize via set()", () => {
      for (let i = 1; i <= 5; i++) {
        cache.set("Child:", `Child:${i}`, { _id: `Child:${i}` });
      }
      expect(cache.getAll("Child:")).toHaveLength(5);

      // 6th entry triggers eviction (5 > maxSize of 5 checked after insert)
      cache.set("Child:", "Child:6", { _id: "Child:6" });

      expect(cache.getAll("Child:")).toHaveLength(0);
    });

    it("clears fullyLoaded state on eviction", () => {
      cache.markFullyLoaded("Child:");
      for (let i = 1; i <= 6; i++) {
        cache.set("Child:", `Child:${i}`, { _id: `Child:${i}` });
      }

      expect(cache.isFullyLoaded("Child:")).toBe(false);
    });

    it("clears all data when setMany exceeds maxSize", () => {
      const records = Array.from({ length: 6 }, (_, i) => ({
        _id: `Child:${i + 1}`,
      }));
      cache.setMany("Child:", records, true);

      expect(cache.getAll("Child:")).toHaveLength(0);
      expect(cache.isFullyLoaded("Child:")).toBe(false);
    });

    it("eviction clears all prefixes, not just the one that triggered it", () => {
      cache.set("Child:", "Child:1", { _id: "Child:1" });
      cache.set("Child:", "Child:2", { _id: "Child:2" });
      cache.set("School:", "School:1", { _id: "School:1" });
      cache.set("School:", "School:2", { _id: "School:2" });
      cache.set("School:", "School:3", { _id: "School:3" });
      // 6th entry triggers eviction
      cache.set("Child:", "Child:3", { _id: "Child:3" });

      expect(cache.getAll("Child:")).toHaveLength(0);
      expect(cache.getAll("School:")).toHaveLength(0);
    });

    it("cache is usable again after eviction", () => {
      for (let i = 1; i <= 6; i++) {
        cache.set("Child:", `Child:${i}`, { _id: `Child:${i}` });
      }
      // cache was evicted

      cache.set("Child:", "Child:new", { _id: "Child:new" });
      expect(cache.get("Child:", "Child:new")).toEqual({ _id: "Child:new" });
    });
  });
});
