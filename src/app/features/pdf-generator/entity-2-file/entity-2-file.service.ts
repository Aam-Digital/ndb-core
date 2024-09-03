import { Injectable } from "@angular/core";
import { Entity } from "../../../core/entity/model/entity";
import { MatDialog } from "@angular/material/dialog";
import { FileTemplateSelectionDialogComponent } from "./file-template-selection-dialog/file-template-selection-dialog.component";

/**
 * Triggers a user flow to
 * generate files based on a file template from an entity.
 */
@Injectable({
  providedIn: "root",
})
export class Entity2FileService {
  constructor(private dialog: MatDialog) {}

  /**
   * Open a dialog for the user to select a template and generate a file from it for the given entity.
   * @param entity
   * @return Boolean whether the action was successfully completed
   */
  async generateFile(entity: Entity): Promise<boolean> {
    this.dialog.open(FileTemplateSelectionDialogComponent, { data: entity });

    return true;
  }
}
