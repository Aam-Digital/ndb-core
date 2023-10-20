import { Injectable } from "@angular/core";
import { ConfirmationDialogService } from "../common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityMapperService } from "./entity-mapper/entity-mapper.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Entity } from "./model/entity";
import { asArray, getUrlWithoutParams } from "../../utils/utils";
import { Router } from "@angular/router";
import { EntitySchemaService } from "./schema/entity-schema.service";
import { FileDatatype } from "../../features/file/file.datatype";
import { FileService } from "../../features/file/file.service";
import { firstValueFrom } from "rxjs";

/**
 * Additional options that can be (partly) specified
 * for the several titles
 */
export interface RemoveEntityTextOptions {
  dialogTitle?: string;
  dialogText?: string;
  deletedEntityInformation?: string;
}

/**
 * A service that can triggers a user flow to safely remove an entity,
 * including a confirmation dialog.
 */
@Injectable({
  providedIn: "root",
})
export class EntityRemoveService {
  constructor(
    private confirmationDialog: ConfirmationDialogService,
    private entityMapper: EntityMapperService,
    private snackBar: MatSnackBar,
    private router: Router,
    private schemaService: EntitySchemaService,
    private fileService: FileService,
  ) {}

  private showSnackbarConfirmation(
    entity: Entity,
    action: string,
    previousEntitiesForUndo: Entity[],
    navigateBackToUrl?: string,
  ) {
    const snackBarTitle = $localize`:Entity action confirmation message:${
      entity.getConstructor().label
    } "${entity.toString()}" ${action}`;

    const snackBarRef = this.snackBar.open(
      snackBarTitle,
      $localize`:Undo an entity action:Undo`,
      {
        duration: 8000,
      },
    );

    // Undo Action
    snackBarRef.onAction().subscribe(async () => {
      await this.entityMapper.saveAll(previousEntitiesForUndo, true);
      if (navigateBackToUrl) {
        await this.router.navigate([navigateBackToUrl]);
      }
    });
  }

  /**
   * Shows a confirmation dialog to the user
   * and removes the entity if the user confirms.
   *
   * This also triggers a toast message, enabling the user to undo the action.
   *
   * @param entity The entity to remove
   * @param textOptions Options that you can specify to override the default options.
   * You can only specify some of the options, the options that you don't specify will then be
   * the default ones.
   * @param navigate whether upon delete the app will navigate back
   */
  async delete<E extends Entity>(
    entity: E,
    navigate: boolean = false,
  ): Promise<boolean> {
    if (
      !(await this.confirmationDialog.getConfirmation(
        $localize`:Delete confirmation title:Delete?`,
        $localize`:Delete confirmation dialog:
        This will remove the data permanently as if it never existed. This cannot be undone. Statistical reports (also for past time periods) will change and not include this record anymore.\n
        If you have not just created this record accidentally, deleting this is probably not what you want to do. If the record represents something that actually happened in your work, consider to use "anonymize" or just "archive" instead, so that you will not lose your documentation for reports.\n
        Are you sure you want to delete this ${
          entity.getConstructor().label
        } record?`,
      ))
    ) {
      return false;
    }

    const affectedEntitiesBeforeAction = await this.deleteEntity(entity);

    let currentUrl: string;
    if (navigate) {
      currentUrl = getUrlWithoutParams(this.router);
      const parentUrl = currentUrl.substring(0, currentUrl.lastIndexOf("/"));
      await this.router.navigate([parentUrl]);
    }

    this.showSnackbarConfirmation(
      affectedEntitiesBeforeAction[0],
      $localize`:Entity action confirmation message verb:Deleted`,
      affectedEntitiesBeforeAction,
      currentUrl,
    );
    return true;
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
  private async deleteEntity(entity: Entity) {
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
  private async cascadeActionToRelatedEntities(
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
            furtherAffectedEntities.forEach((e) =>
              originalAffectedEntitiesForUndo.push(e.copy()),
            );
          } else {
            const furtherAffectedEntities = await aggregateAction(
              e,
              refField,
              entity,
            );
            furtherAffectedEntities.forEach((e) =>
              originalAffectedEntitiesForUndo.push(e.copy()),
            );
          }
        }
      }
    }

    return originalAffectedEntitiesForUndo;
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

  /**
   * Anonymize the given entity,
   * removing properties that are not explicitly configured in the schema to be retained.
   *
   * This triggers UX interactions like confirmation request dialog and snackbar message as well.
   *
   * @param entity
   */
  async anonymize<E extends Entity>(entity: E) {
    if (
      !(await this.confirmationDialog.getConfirmation(
        $localize`:Anonymize confirmation dialog:Anonymize?`,
        $localize`:Anonymize confirmation dialog:
        This will remove all personal information (PII) permanently and keep only a basic record for statistical reports. Details that are removed during anonymization cannot be recovered.\n
        If this ${
          entity.getConstructor().label
        } has only become inactive and you want to keep all details about the record, consider to use "archive" instead.\n
        Are you sure you want to anonymize this record?`,
      ))
    ) {
      return false;
    }

    const affectedEntitiesBeforeAction = await this.anonymizeEntity(entity);

    this.showSnackbarConfirmation(
      affectedEntitiesBeforeAction[0],
      $localize`:Entity action confirmation message verb:Anonymized`,
      affectedEntitiesBeforeAction,
    );
    return true;
  }

  /**
   * The actual anonymize action without user interactions.
   * @param entity
   * @private
   */
  private async anonymizeEntity(entity: Entity) {
    const originalEntity = entity.copy();

    for (const [key, schema] of entity.getSchema().entries()) {
      if (entity[key] === undefined) {
        continue;
      }

      switch (schema.anonymize) {
        case "retain":
          break;
        case "retain-anonymized":
          await this.anonymizeProperty(entity, key);
          break;
        default:
          await this.removeProperty(entity, key);
      }
    }

    entity.anonymized = true;
    entity.inactive = true;

    await this.entityMapper.save(entity);

    const affectedEntitiesBeforeAction =
      await this.cascadeActionToRelatedEntities(
        entity,
        (e) => this.anonymizeEntity(e),
        async (e) => [],
      );

    return [originalEntity, ...affectedEntitiesBeforeAction];
  }

  private async anonymizeProperty(entity: Entity, key: string) {
    const dataType = this.schemaService.getDatatypeOrDefault(
      entity.getSchema().get(key).dataType,
    );

    entity[key] = await dataType.anonymize(
      entity[key],
      entity.getSchema().get(key),
      entity,
    );
  }

  /**
   * Mark the given entity as inactive.
   * @param entity
   */
  async archive<E extends Entity>(entity: E) {
    const originalEntity = entity.copy();
    entity.inactive = true;
    await this.entityMapper.save(entity);

    this.showSnackbarConfirmation(
      originalEntity,
      $localize`:Entity action confirmation message verb:Archived`,
      [originalEntity],
    );
    return true;
  }
  /**
   * Undo the archive action on the given entity.
   * @param entity
   */
  async undoArchive<E extends Entity>(entity: E) {
    const originalEntity = entity.copy();
    entity.inactive = false;
    await this.entityMapper.save(entity);

    this.showSnackbarConfirmation(
      originalEntity,
      $localize`:Entity action confirmation message verb:Reactivated`,
      [originalEntity],
    );
    return true;
  }

  private async removeProperty(entity: Entity, key: string) {
    if (
      entity.getSchema().get(key).dataType === FileDatatype.dataType &&
      entity[key]
    ) {
      await firstValueFrom(this.fileService.removeFile(entity, key));
    }

    delete entity[key];
  }
}
