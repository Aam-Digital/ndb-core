import { Injectable } from "@angular/core";
import { Entity } from "../../../core/entity/model/entity";
import { MatDialog } from "@angular/material/dialog";
import { TemplateExportSelectionDialogComponent } from "../template-export-selection-dialog/template-export-selection-dialog.component";

/**
 * Triggers a user flow to
 * generate files based on a file template from an entity.
 */
@Injectable({
  providedIn: "root",
})
export class TemplateExportService {
  constructor(private dialog: MatDialog) {}

  /**
   * Open a dialog for the user to select a template and generate a file from it for the given entity.
   * @param entity The entity or other data object to provide placeholder values for the template
   * @return Boolean whether the action was successfully completed
   */
  async generateFile(entity: Entity | Object): Promise<boolean> {
    this.dialog.open(TemplateExportSelectionDialogComponent, { data: entity });

    return true;
  }
}
