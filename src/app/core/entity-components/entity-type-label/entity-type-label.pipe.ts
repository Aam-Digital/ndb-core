import { Pipe, PipeTransform } from "@angular/core";
import { EntityRegistry } from "../../entity/database-entity.decorator";

/**
 * Transform an entity type key to its human-readable label.
 */
@Pipe({
  name: "entityTypeLabel",
  standalone: true,
})
export class EntityTypeLabelPipe implements PipeTransform {
  constructor(private entityTypes: EntityRegistry) {}

  transform(value: string, plural: boolean = false): string {
    const entity = this.entityTypes.get(value);
    return plural ? entity?.labelPlural : entity?.label;
  }
}
