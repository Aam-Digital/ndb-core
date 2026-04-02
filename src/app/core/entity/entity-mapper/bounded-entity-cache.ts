/**
 * A bounded, type-partitioned cache for raw database records.
 *
 * Records are stored in a nested Map: type prefix → entity _id → raw record.
 * This gives O(1) single-entity lookups and O(k) type-level collection
 * (k = entities of that type).
 *
 * When total entries exceed {@link maxSize}, the entire cache is cleared.
 */
export class BoundedEntityCache {
  private data = new Map<string, Map<string, any>>();
  private fullyLoadedPrefixes = new Set<string>();
  private size = 0;

  constructor(readonly maxSize: number = 5000) {}

  get(prefix: string, id: string): any | undefined {
    return this.data.get(prefix)?.get(id);
  }

  getAll(prefix: string): any[] {
    return Array.from(this.data.get(prefix)?.values() ?? []);
  }

  isFullyLoaded(prefix: string): boolean {
    return this.fullyLoadedPrefixes.has(prefix);
  }

  markFullyLoaded(prefix: string) {
    this.fullyLoadedPrefixes.add(prefix);
  }

  set(prefix: string, id: string, record: any) {
    const inner = this.getOrCreateInner(prefix);
    if (!inner.has(id)) {
      this.size++;
    }
    inner.set(id, record);
    this.evictIfNeeded();
  }

  setMany(prefix: string, records: any[], markFullyLoaded = false) {
    const inner = this.getOrCreateInner(prefix);
    for (const rec of records) {
      if (!inner.has(rec._id)) {
        this.size++;
      }
      inner.set(rec._id, rec);
    }
    if (markFullyLoaded) {
      this.fullyLoadedPrefixes.add(prefix);
    }
    this.evictIfNeeded();
  }

  delete(prefix: string, id: string) {
    const inner = this.data.get(prefix);
    if (inner?.delete(id)) {
      this.size--;
    }
  }

  private getOrCreateInner(prefix: string): Map<string, any> {
    let inner = this.data.get(prefix);
    if (!inner) {
      inner = new Map();
      this.data.set(prefix, inner);
    }
    return inner;
  }

  private evictIfNeeded() {
    if (this.size > this.maxSize) {
      this.data.clear();
      this.fullyLoadedPrefixes.clear();
      this.size = 0;
    }
  }
}
