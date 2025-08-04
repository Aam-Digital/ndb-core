import { inject, Pipe, PipeTransform } from "@angular/core";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntityConstructor } from "#src/app/core/entity/model/entity";

/**
 * Transform an entity type key to its full constructor.
 */
@Pipe({
  name: "entityType",
  standalone: true,
})
export class EntityTypePipe implements PipeTransform {
  private readonly entityTypes = inject(EntityRegistry);

  transform(value: string): EntityConstructor {
    const entity = this.entityTypes.get(value);
    return entity;
  }
}
