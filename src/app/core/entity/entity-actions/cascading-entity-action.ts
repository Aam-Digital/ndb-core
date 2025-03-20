import { Entity } from "../model/entity";
import { asArray } from "app/utils/asArray";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { EntityRelationsService } from "../entity-mapper/entity-relations.service";
import { Injectable } from "@angular/core";

export class CascadingActionResult {
  /**
   * entities that have been updated in the process, in their original state
   * (can be used for undo action)
   */
  originalEntitiesBeforeChange: Entity[];

  /**
   * entities that may still contain PII related to the primary entity that could not be automatically removed
   * (may need manual review by the user)
   */
  potentiallyRetainingPII: Entity[];

  constructor(changedEntities?: Entity[], potentiallyRetainingPII?: Entity[]) {
    this.originalEntitiesBeforeChange = changedEntities ?? [];
    this.potentiallyRetainingPII = potentiallyRetainingPII ?? [];
  }

  mergeResults(otherResult: CascadingActionResult) {
    this.originalEntitiesBeforeChange = [
      ...this.originalEntitiesBeforeChange,
      ...otherResult.originalEntitiesBeforeChange.filter(
        (e) =>
          !this.originalEntitiesBeforeChange.some(
            (x) => x.getId() === e.getId(),
          ),
      ),
    ];
    this.potentiallyRetainingPII = [
      ...this.potentiallyRetainingPII,
      ...otherResult.potentiallyRetainingPII.filter(
        (e) =>
          !this.potentiallyRetainingPII.some((x) => x.getId() === e.getId()),
      ),
    ];

    return this;
  }
}

/**
 * extend this class to implement services that perform actions on an entity
 * that require recursive actions to related entities as well.
 */
@Injectable()
export abstract class CascadingEntityAction {
  protected constructor(
    protected entityMapper: EntityMapperService,
    protected schemaService: EntitySchemaService,
    protected entityRelationsService: EntityRelationsService,
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
    ) => Promise<CascadingActionResult>,
    aggregateAction: (
      relatedEntity: Entity,
      refField?: string,
      entity?: Entity,
    ) => Promise<CascadingActionResult>,
  ): Promise<CascadingActionResult> {
    const cascadeActionResult = new CascadingActionResult();

    const affectedEntities =
      await this.entityRelationsService.loadAllLinkingToEntity(entity);
    for (const affected of affectedEntities) {
      for (const refField of affected.fields) {
        if (
          refField.entityReferenceRole === "composite" &&
          asArray(affected.entity[refField.id]).length === 1
        ) {
          // is only composite
          const result = await compositeAction(
            affected.entity,
            refField.id,
            entity,
          );
          cascadeActionResult.mergeResults(result);
        } else {
          const result = await aggregateAction(
            affected.entity,
            refField.id,
            entity,
          );
          cascadeActionResult.mergeResults(result);
        }
      }
    }

    return cascadeActionResult;
  }
}
