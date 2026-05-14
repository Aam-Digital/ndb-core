import {
  Component,
  ViewEncapsulation,
  inject,
  ChangeDetectionStrategy,
  effect,
  input,
  signal,
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

  loading = signal<boolean>(true);
  selectedActivity = signal<Entity | undefined>(undefined);
  activities = signal<Entity[]>([]);
  archivedActivities = signal<Entity[]>([]);

  constructor() {
    effect((onCleanup) => {
      const entity = this.entity();
      if (!entity) {
        this.loading.set(false);
        this.selectedActivity.set(undefined);
        this.activities.set([]);
        this.archivedActivities.set([]);
        return;
      }

      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });

      void this.loadActivities(entity, () => cancelled);
    });
  }

  private async loadActivities(
    entity: Entity,
    isCancelled: () => boolean,
  ): Promise<void> {
    this.loading.set(true);
    try {
      const allActivities =
        await this.attendanceService.getActivitiesForParticipant(
          entity.getId(),
        );
      if (isCancelled()) {
        return;
      }

      this.activities.set(allActivities.filter((a) => a.isActive));
      this.archivedActivities.set(allActivities.filter((a) => !a.isActive));
    } catch (error) {
      if (!isCancelled()) {
        this.activities.set([]);
        this.archivedActivities.set([]);
      }
      Logging.warn("Could not load grouped child attendance activities", error);
    } finally {
      if (!isCancelled()) {
        this.loading.set(false);
      }
    }
  }

  onActivityChange(selectedArchivedActivity: Entity) {
    this.selectedActivity.set(selectedArchivedActivity);
  }
}
