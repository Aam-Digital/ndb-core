import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  Signal,
} from "@angular/core";
import { ComingSoonDialogService } from "#src/app/features/coming-soon/coming-soon-dialog.service";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { ViewTitleComponent } from "#src/app/core/common-components/view-title/view-title.component";
import { RouteTarget } from "#src/app/route-target";
import { EntityConstructor } from "#src/app/core/entity/model/entity";
import { DisableEntityOperationDirective } from "#src/app/core/permissions/permission-directive/disable-entity-operation.directive";

@RouteTarget("AttendanceManager")
@Component({
  selector: "app-attendance-manager",
  templateUrl: "./attendance-manager.component.html",
  styleUrls: ["./attendance-manager.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatButtonModule,
    RouterLink,
    ViewTitleComponent,
    DisableEntityOperationDirective,
  ],
})
export class AttendanceManagerComponent {
  comingSoonDialog = inject(ComingSoonDialogService);

  activityTypes: Signal<EntityConstructor[]> = signal([]);
  hasPermissionsToRecordEvent: Signal<boolean> = signal(true);
}
