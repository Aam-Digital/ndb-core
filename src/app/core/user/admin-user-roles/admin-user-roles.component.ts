import { Component, inject } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { JsonEditorService } from "../../admin/json-editor/json-editor.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Config } from "../../config/config";
import moment from "moment";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";

@Component({
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
  private readonly entityMapper = inject(EntityMapperService);
  private readonly snackBar = inject(MatSnackBar);

  async editPermissions() {
    const permissionsConfig = await this.entityMapper
      .load(Config, Config.PERMISSION_KEY)
      .catch(() => new Config(Config.PERMISSION_KEY, {}));

    this.jsonEditorService
      .openJsonEditorDialog(permissionsConfig.data)
      .subscribe(async (updatedData) => {
        if (!updatedData) return;

        const previousConfigBackup = new Config(
          Config.PERMISSION_KEY + ":" + moment().format("YYYY-MM-DD_HH-mm-ss"),
          permissionsConfig.data,
        );
        await this.entityMapper.save(previousConfigBackup);

        permissionsConfig.data = updatedData;
        await this.entityMapper.save(permissionsConfig);

        // Show undo snackbar
        const snackBarRef = this.snackBar.open(
          $localize`Permissions updated`,
          $localize`Undo`,
          { duration: 8000 },
        );
        snackBarRef.onAction().subscribe(async () => {
          permissionsConfig.data = previousConfigBackup.data;
          await this.entityMapper.save(permissionsConfig);
          await this.entityMapper.remove(previousConfigBackup);
        });
      });
  }
}
