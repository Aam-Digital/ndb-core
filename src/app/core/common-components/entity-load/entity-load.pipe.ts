import { Pipe, PipeTransform, inject } from "@angular/core";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../entity/model/entity";

/**
 * Transform an ID and type to a entity loaded from the database.
 */
@Pipe({
  name: "entityLoad",
  standalone: true,
})
export class EntityLoadPipe implements PipeTransform {
  private readonly entityMapper = inject(EntityMapperService);

  transform(id: string, type: string): Promise<Entity> {
    const entity = this.entityMapper.load(type, id);
    return entity;
  }
}
