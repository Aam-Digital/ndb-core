import { inject, Pipe, PipeTransform } from "@angular/core";
import { EntityRegistry } from "../../entity/database-entity.decorator";

/**
 * Transform an entity type key or list of keys to their human-readable label(s).
 */
@Pipe({
  name: "entityTypeLabel",
  standalone: true,
})
export class EntityTypeLabelPipe implements PipeTransform {
  private readonly entityTypes = inject(EntityRegistry);

  transform(value: string | string[], plural: boolean = false): string {
    // If value is an array, map each to label and join with "/"
    if (Array.isArray(value)) {
      return value
        .map((v) => this.getLabel(v, plural))
        .filter(Boolean)
        .join(" / ");
    } else {
      return this.getLabel(value, plural);
    }
  }

  /**
   * Look up the label for a single entity type key,
   * falling back to the raw key if the type is not registered
   * (e.g. a config still references a type that was removed/renamed).
   */
  private getLabel(key: string, plural: boolean): string {
    // `EntityRegistry.get` throws for unregistered keys, so guard with `has`
    // to degrade gracefully instead of crashing the surrounding view.
    const entity = this.entityTypes.has(key)
      ? this.entityTypes.get(key)
      : undefined;
    return entity ? (plural ? entity.labelPlural : entity.label) : key;
  }
}
