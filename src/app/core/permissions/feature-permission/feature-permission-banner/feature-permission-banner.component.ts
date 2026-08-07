import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { EntityConstructor } from "../../../entity/model/entity";
import { HintBoxComponent } from "../../../common-components/hint-box/hint-box.component";
import { PermissionsConfigService } from "../../permissions-config.service";
import {
  FeaturePermissionDialogComponent,
  FeaturePermissionDialogData,
} from "../feature-permission-dialog/feature-permission-dialog.component";

/**
 * Info banner shown on the admin/list view of a "feature" entity type that lets
 * an admin review and edit which user roles can use or manage the feature.
 *
 * The banner (and the edit action) is only shown to users who are allowed to
 * change the permissions config.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-feature-permission-banner",
  templateUrl: "./feature-permission-banner.component.html",
  imports: [HintBoxComponent, MatButtonModule],
})
export class FeaturePermissionBannerComponent {
  private readonly permissionsConfig = inject(PermissionsConfigService);
  private readonly dialog = inject(MatDialog);

  /** the feature entity type whose permissions are managed here */
  readonly entityType = input.required<EntityConstructor>();

  /** whether the current user may edit the permissions config */
  readonly canManage = toSignal(this.permissionsConfig.canManagePermissions$, {
    initialValue: false,
  });

  openDialog(): void {
    const entityConstructor = this.entityType();
    this.dialog.open(FeaturePermissionDialogComponent, {
      data: {
        entityType: entityConstructor.ENTITY_TYPE,
        entityLabel: entityConstructor.labelPlural,
      } as FeaturePermissionDialogData,
      maxWidth: "600px",
    });
  }
}
