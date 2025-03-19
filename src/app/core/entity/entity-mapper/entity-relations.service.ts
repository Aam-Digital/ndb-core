import { inject, Injectable } from "@angular/core";
import { Entity } from "../model/entity";
import { EntityMapperService } from "./entity-mapper.service";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { asArray } from "../../../utils/asArray";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";

/**
 * Service to work with related, interlinked entities.
 */
@Injectable({
  providedIn: "root",
})
export class EntityRelationsService {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly schemaService = inject(EntitySchemaService);

  /**
   * Find all entities that reference the given entity.
   * @param entity The entity to find references to
   * @returns An array of objects containing an entity referencing the given entity and its specific fields that reference it
   */
  async loadAllLinkingToEntity(
    entity: Entity,
  ): Promise<{ entity: Entity; fields: FormFieldConfig[] }[]> {
    const affectedEntities = [];

    const entityTypesWithReferences =
      this.schemaService.getEntityTypesReferencingType(entity.getType());

    for (const refType of entityTypesWithReferences) {
      const entities = await this.entityMapper.loadType(refType.entityType);

      for (const affectedEntity of entities) {
        const affectedFields: FormFieldConfig[] = [];
        for (const refField of refType.referencingProperties) {
          if (asArray(affectedFields[refField.id]).includes(entity.getId())) {
            affectedFields.push(refField);
          }
        }

        if (affectedFields.length > 0) {
          affectedEntities.push({
            entity: affectedEntity,
            fields: affectedFields,
          });
        }
      }
    }

    return affectedEntities;
  }
}
