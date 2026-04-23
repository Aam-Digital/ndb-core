import { inject, Injectable } from "@angular/core";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";

export interface DuplicatePair {
  record: Entity;
  possibleDuplicate: Entity;
}

@Injectable({
  providedIn: "root",
})
export class DuplicateDetectionService {
  private readonly entityMapper = inject(EntityMapperService);

  async findDuplicates(
    entityConstructor: EntityConstructor,
    fields: string[],
  ): Promise<DuplicatePair[]> {
    if (fields.length === 0) {
      return [];
    }

    const entities = await this.entityMapper.loadType(entityConstructor);
    const pairs: DuplicatePair[] = [];
    const usedIds = new Set<string>();

    for (let i = 0; i < entities.length; i++) {
      if (usedIds.has(entities[i].getId())) continue;
      for (let j = i + 1; j < entities.length; j++) {
        if (
          !usedIds.has(entities[j].getId()) &&
          this.allFieldsMatch(entities[i], entities[j], fields)
        ) {
          pairs.push({ record: entities[i], possibleDuplicate: entities[j] });
          usedIds.add(entities[i].getId());
          usedIds.add(entities[j].getId());
          break;
        }
      }
    }

    return pairs;
  }

  private allFieldsMatch(a: Entity, b: Entity, fields: string[]): boolean {
    return fields.every((field) => {
      const valA = this.normalizeValue(a[field]);
      const valB = this.normalizeValue(b[field]);
      return valA !== "" && valA === valB;
    });
  }

  private normalizeValue(value: unknown): string {
    if (value == null) return "";
    if (value instanceof Date) return value.toISOString().toLowerCase();
    // Arrays are intentionally excluded in this first exact-match implementation.
    // Selecting an array field will therefore not yield duplicate matches.
    if (Array.isArray(value)) return "";

    if (typeof value === "object") {
      const idValue = (value as Record<string, unknown>)["id"];
      return typeof idValue === "string" ||
        typeof idValue === "number" ||
        typeof idValue === "boolean"
        ? String(idValue).normalize("NFKC").trim().toLowerCase()
        : "";
    }

    if (
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      return "";
    }

    return String(value)
      .normalize("NFKC")
      .replaceAll(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }
}
