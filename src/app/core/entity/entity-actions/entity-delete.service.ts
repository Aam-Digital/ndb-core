import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { Entity } from "../model/entity";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { CascadingEntityAction } from "./cascading-entity-action";

/**
 * Safely delete an entity including handling references with related entities.
 * This service is usually used in combination with the `EntityActionsService`, which provides user confirmation processes around this.
 */
@Injectable({
  providedIn: "root",
})
export class EntityDeleteService extends CascadingEntityAction {
  constructor(
    protected entityMapper: EntityMapperService,
    protected schemaService: EntitySchemaService,
  ) {
    super(entityMapper, schemaService);
  }

  /**
   * The actual delete action without user interactions.
   *
   * Returns an array of all affected entities (including the given entity) in their state before the action
   * to support an undo action.
   *
   * @param entity
   * @private
   */
  async deleteEntity(entity: Entity) {
    const affectedEntitiesBeforeAction =
      await this.cascadeActionToRelatedEntities(
        entity,
        (e) => this.deleteEntity(e),
        (e, refField, entity) =>
          this.removeReferenceFromEntity(e, refField, entity),
      );

    const originalEntity = entity.copy();
    await this.entityMapper.remove(entity);

    return [originalEntity, ...affectedEntitiesBeforeAction];
  }

  /**
   * Change and save the entity, removing referenced ids of the given referenced entity.
   *
   * Returns an array of the affected entities (which here is only the given entity) in the state before the action
   * to support an undo action.
   *
   * @param relatedEntityWithReference
   * @param refField
   * @param referencedEntity
   * @private
   */
  private async removeReferenceFromEntity(
    relatedEntityWithReference: Entity,
    refField: string,
    referencedEntity: Entity,
  ): Promise<Entity[]> {
    const originalEntity = relatedEntityWithReference.copy();

    if (Array.isArray(relatedEntityWithReference[refField])) {
      relatedEntityWithReference[refField] = relatedEntityWithReference[
        refField
      ].filter((id) => id !== referencedEntity.getId());
    } else {
      delete relatedEntityWithReference[refField];
    }

    await this.entityMapper.save(relatedEntityWithReference);
    return [originalEntity];
  }
}
