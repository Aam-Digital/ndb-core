import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { JsonEditorService } from "../../admin/json-editor/json-editor.service";
import { Config } from "../../config/config";
import { Logging } from "../../logging/logging.service";
import { DatabaseRules } from "../../permissions/permission-types";
import { PermissionsConfigService } from "../../permissions/permissions-config.service";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-user-roles",
  imports: [
    ViewTitleComponent,
    FaIconComponent,
    MatButtonModule,
    HintBoxComponent,
  ],
  templateUrl: "./admin-user-roles.component.html",
  styleUrl: "./admin-user-roles.component.scss",
})
export class AdminUserRolesComponent {
  private readonly jsonEditorService = inject(JsonEditorService);
  private readonly permissionsConfig = inject(PermissionsConfigService);
  private readonly snackBar = inject(MatSnackBar);

  async editPermissions() {
    let config: Config<DatabaseRules>;
    try {
      config =
        (await this.permissionsConfig.load()) ??
        new Config<DatabaseRules>(Config.PERMISSION_KEY, {});
    } catch (error) {
      // editing on top of a failed load would overwrite the stored permissions
      Logging.error("Failed to load permissions config", error);
      this.showError(
        $localize`Could not load the permissions. Please try again.`,
      );
      return;
    }

    this.jsonEditorService
      .openJsonEditorDialog(config.data)
      .subscribe(async (updatedData) => {
        if (!updatedData) return;

        try {
          const backup = await this.permissionsConfig.saveWithBackup(
            config,
            updatedData,
          );
          this.permissionsConfig.offerUndo(
            backup,
            $localize`Permissions updated`,
          );
        } catch (error) {
          // rxjs does not await this handler, so the rejection would be silent
          Logging.error("Failed to save permissions config", error);
          this.showError(
            $localize`Could not save the permissions. Please try again.`,
          );
        }
      });
  }

  private showError(message: string) {
    this.snackBar.open(message, undefined, { duration: 5000 });
  }
}
