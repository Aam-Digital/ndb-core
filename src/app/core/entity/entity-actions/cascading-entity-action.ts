import { Entity } from "../model/entity";
import { asArray } from "../../../utils/utils";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";

/**
 * extend this class to implement services that perform actions on an entity
 * that require recursive actions to related entities as well.
 */
export abstract class CascadingEntityAction {
  protected constructor(
    protected entityMapper: EntityMapperService,
    protected schemaService: EntitySchemaService,
  ) {}

  /**
   * Recursively call the given actions on all related entities that contain a reference to the given entity.
   *
   * Returns an array of all affected related entities (excluding the given entity) in their state before the action
   * to support an undo action.
   *
   * @param entity
   * @param compositeAction
   * @param aggregateAction
   * @private
   */
  protected async cascadeActionToRelatedEntities(
    entity: Entity,
    compositeAction: (
      relatedEntity: Entity,
      refField?: string,
      entity?: Entity,
    ) => Promise<Entity[]>,
    aggregateAction: (
      relatedEntity: Entity,
      refField?: string,
      entity?: Entity,
    ) => Promise<Entity[]>,
  ): Promise<Entity[]> {
    const originalAffectedEntitiesForUndo: Entity[] = [];

    const entityTypesWithReferences =
      this.schemaService.getEntityTypesReferencingType(entity.getType());

    for (const refType of entityTypesWithReferences) {
      const entities = await this.entityMapper.loadType(refType.entityType);

      for (const refField of refType.referencingProperties) {
        const affectedEntities = entities.filter(
          (e) =>
            asArray(e[refField]).includes(entity.getId()) ||
            asArray(e[refField]).includes(entity.getId(true)),
        );

        for (const e of affectedEntities) {
          if (
            refType.entityType.schema.get(refField).entityReferenceRole ===
              "composite" &&
            asArray(e[refField]).length === 1
          ) {
            // is only composite
            const furtherAffectedEntities = await compositeAction(e);
            originalAffectedEntitiesForUndo.push(...furtherAffectedEntities);
          } else {
            const furtherAffectedEntities = await aggregateAction(
              e,
              refField,
              entity,
            );
            originalAffectedEntitiesForUndo.push(...furtherAffectedEntities);
          }
        }
      }
    }

    return originalAffectedEntitiesForUndo;
  }
}
