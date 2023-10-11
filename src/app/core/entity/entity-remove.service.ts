import { Injectable } from "@angular/core";
import { ConfirmationDialogService } from "../common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityMapperService } from "./entity-mapper/entity-mapper.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Entity } from "./model/entity";
import { getUrlWithoutParams } from "../../utils/utils";
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
    navigateBackToUrl?: string,
  ) {
    const snackBarTitle = $localize`:Entity action confirmation message:${action} ${
      entity.getConstructor().label
    } "${entity.toString()}"`;

    const snackBarRef = this.snackBar.open(
      snackBarTitle,
      $localize`:Undo an entity action:Undo`,
      {
        duration: 8000,
      },
    );

    // Undo Action
    snackBarRef.onAction().subscribe(async () => {
      await this.entityMapper.save(entity, true);
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

    const originalEntity = entity.copy();
    await this.entityMapper.remove(entity);

    let currentUrl: string;
    if (navigate) {
      currentUrl = getUrlWithoutParams(this.router);
      const parentUrl = currentUrl.substring(0, currentUrl.lastIndexOf("/"));
      await this.router.navigate([parentUrl]);
    }

    this.showSnackbarConfirmation(
      originalEntity,
      $localize`:Entity action confirmation message verb:Deleted`,
      currentUrl,
    );
    return true;
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

    const originalEntity = entity.copy();
    await this.anonymizeEntity(entity);
    await this.entityMapper.save(entity);

    this.showSnackbarConfirmation(
      originalEntity,
      $localize`:Entity action confirmation message verb:Anonymized`,
    );
    return true;
  }

  private async anonymizeEntity(entity: Entity) {
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
    );
    return true;
  }
  /**
   * Undo the archive action on the given entity.
   * @param entity
   */
  async archiveUndo<E extends Entity>(entity: E) {
    const originalEntity = entity.copy();
    entity.inactive = false;
    await this.entityMapper.save(entity);

    this.showSnackbarConfirmation(
      originalEntity,
      $localize`:Entity action confirmation message verb:Reactivated`,
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
