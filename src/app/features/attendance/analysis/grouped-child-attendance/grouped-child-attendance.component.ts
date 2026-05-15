import {
  Component,
  ViewEncapsulation,
  inject,
  ChangeDetectionStrategy,
  computed,
  input,
  linkedSignal,
  resource,
} from "@angular/core";
import { Entity } from "#src/app/core/entity/model/entity";
import { AttendanceService } from "../../attendance.service";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTabsModule } from "@angular/material/tabs";
import { TabStateModule } from "#src/app/utils/tab-state/tab-state.module";
import { ActivityAttendanceSectionComponent } from "../activity-attendance-section/activity-attendance-section.component";
import { MatSelectModule } from "@angular/material/select";
import { Logging } from "#src/app/core/logging/logging.service";

/**
 * Lists all activities of the given child
 * and displays a tab with detailed analysis for each.
 */
@DynamicComponent("GroupedChildAttendance")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-grouped-child-attendance",
  templateUrl: "./grouped-child-attendance.component.html",
  styleUrls: ["./grouped-child-attendance.component.scss"],
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatProgressBarModule,
    MatTabsModule,
    TabStateModule,
    ActivityAttendanceSectionComponent,
    MatSelectModule,
  ],
})
export class GroupedChildAttendanceComponent {
  private attendanceService = inject(AttendanceService);

  entity = input<Entity>();

  protected activitiesResource = resource({
    params: () => ({ entity: this.entity() }),
    loader: async ({ params: { entity } }) => {
      if (!entity) return { active: [], archived: [] };
      try {
        const allActivities =
          await this.attendanceService.getActivitiesForParticipant(
            entity.getId(),
          );
        return {
          active: allActivities.filter((a) => a.isActive),
          archived: allActivities.filter((a) => !a.isActive),
        };
      } catch (error) {
        Logging.warn(
          "Could not load grouped child attendance activities",
          error,
        );
        return { active: [], archived: [] };
      }
    },
  });

  activities = computed(() => this.activitiesResource.value()?.active ?? []);
  archivedActivities = computed(
    () => this.activitiesResource.value()?.archived ?? [],
  );

  selectedActivity = linkedSignal<Entity | undefined>(() => {
    this.entity();
    return undefined;
  });

  onActivityChange(selectedArchivedActivity: Entity) {
    this.selectedActivity.set(selectedArchivedActivity);
  }
}
