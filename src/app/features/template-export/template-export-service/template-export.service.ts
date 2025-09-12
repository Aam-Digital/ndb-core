import { Injectable, inject } from "@angular/core";
import { Entity } from "../../../core/entity/model/entity";
import { MatDialog } from "@angular/material/dialog";
import { TemplateExportSelectionDialogComponent } from "../template-export-selection-dialog/template-export-selection-dialog.component";
import { catchError, firstValueFrom, map, of } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { environment } from "#src/environments/environment";
import { Logging } from "#src/app/core/logging/logging.service";

/**
 * Triggers a user flow to
 * generate files based on a file template from an entity.
 */
@Injectable({
  providedIn: "root",
})
export class TemplateExportService {
  private dialog = inject(MatDialog);
  private readonly httpClient = inject(HttpClient);
  /**
   * Open a dialog for the user to select a template and generate a file from it for the given entity.
   * @param entity The entity or other data object to provide placeholder values for the template
   * @return Boolean whether the action was successfully completed
   */
  async generateFile(entity: Entity | Object): Promise<boolean> {
    this.dialog.open(TemplateExportSelectionDialogComponent, { data: entity });

    return true;
  }

  async isExportServerEnabled(): Promise<boolean> {
    return firstValueFrom(
      this.httpClient
        .get(environment.API_PROXY_PREFIX + "/actuator/features")
        .pipe(
          map((res) => {
            return res?.["export"]?.enabled ?? false;
          }),
          catchError((err) => {
            // if aam-services backend is not running --> 502
            // if aam-services Export API disabled --> 404
            Logging.debug("Export API not available", err);
            return of(false);
          }),
        ),
    );
  }
}
