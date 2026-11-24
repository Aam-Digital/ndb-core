import { Injectable } from "@angular/core";
import { Entity } from "../../entity/model/entity";

/**
 * The records the demo data engine generated, by entity type.
 *
 * Generators that keep their own logic read the engine's records from here
 * instead of injecting each other.
 */
@Injectable()
export class DemoEntityStore {
  private readonly byType = new Map<string, Entity[]>();

  set(entityType: string, entities: Entity[]): void {
    this.byType.set(entityType, entities);
  }

  /** Add records of a type, keeping the ones already stored. */
  add(entityType: string, entities: Entity[]): void {
    this.byType.set(entityType, [...this.get(entityType), ...entities]);
  }

  get(entityType: string): Entity[] {
    return this.byType.get(entityType) ?? [];
  }

  entries(): [string, Entity[]][] {
    return Array.from(this.byType.entries());
  }

  clear(): void {
    this.byType.clear();
  }
}
