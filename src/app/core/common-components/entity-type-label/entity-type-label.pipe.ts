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
        .map((v) => {
          const entity = this.entityTypes.get(v);
          return entity ? (plural ? entity.labelPlural : entity.label) : v;
        })
        .filter(Boolean)
        .join(" / ");
    } else {
      const entity = this.entityTypes.get(value);
      return plural ? entity?.labelPlural : entity?.label;
    }
  }
}
