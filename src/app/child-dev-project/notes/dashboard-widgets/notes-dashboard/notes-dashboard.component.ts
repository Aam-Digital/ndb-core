import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from "@angular/core";
import { ChildrenService } from "../../../children/children.service";
import moment from "moment";
import { MatTableModule } from "@angular/material/table";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { EntityConstructor } from "../../../../core/entity/model/entity";
import { DecimalPipe } from "@angular/common";
import { EntityBlockComponent } from "../../../../core/basic-datatypes/entity/entity-block/entity-block.component";
import { Note } from "../../model/note";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";

interface NotesDashboardConfig {
  entity?: string;
  sinceDays?: number;
  fromBeginningOfWeek?: boolean;
  mode?: "with-recent-notes" | "without-recent-notes";
}

/**
 * Dashboard Widget displaying entities that do not have a recently added Note.
 *
 * If you do not set "sinceDays" of "fromBeginningOfWeek" inputs
 * by default notes since beginning of the current week are considered.
 */
@DynamicComponent("NotesDashboard")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-no-recent-notes-dashboard",
  templateUrl: "./notes-dashboard.component.html",
  styleUrls: ["./notes-dashboard.component.scss"],
  imports: [
    MatTableModule,
    EntityBlockComponent,
    DecimalPipe,
    DashboardListWidgetComponent,
  ],
})
export class NotesDashboardComponent {
  private childrenService = inject(ChildrenService);
  private entities = inject(EntityRegistry);

  static getRequiredEntities(config: NotesDashboardConfig) {
    return config?.entity || Note.ENTITY_TYPE;
  }

  /** Entity for which the recent notes should be counted. */
  entity = input("Child");
  readonly entityDefinition = computed<EntityConstructor>(() =>
    this.entities.get(this.entity()),
  );
  /**
   * number of days since last note that entities should be considered having a "recent" note.
   */
  sinceDays = input(0);

  /** Whether an additional offset should be automatically added to include notes from the beginning of the week */
  fromBeginningOfWeek = input(true);

  mode = input<"with-recent-notes" | "without-recent-notes">();

  /**
   * Entities displayed in the template with additional "daysSinceLastNote" field
   */
  entries = signal<EntityWithRecentNoteInfo[]>([]);

  subtitle = computed(() => {
    const entity = this.entityDefinition();
    switch (this.mode()) {
      case "with-recent-notes":
        return $localize`:Subtitle|Subtitle informing the user that these are the records with recent reports:${entity.labelPlural} with recent report`;
      case "without-recent-notes":
        return $localize`:Subtitle|Subtitle informing the user that these are the records without recent reports:${entity.labelPlural} having no recent reports`;
      default:
        return "";
    }
  });

  constructor() {
    effect((onCleanup) => {
      this.entityDefinition();
      this.sinceDays();
      this.fromBeginningOfWeek();
      this.mode();

      let isCurrent = true;
      untracked(() => {
        void this.loadConcernedEntities(() => isCurrent);
      });

      onCleanup(() => {
        isCurrent = false;
      });
    });
  }

  private async loadConcernedEntities(isCurrent: () => boolean) {
    const mode = this.mode();
    if (!mode) {
      this.entries.set([]);
      return;
    }

    let dayRangeBoundary = this.sinceDays();
    if (this.fromBeginningOfWeek()) {
      dayRangeBoundary += moment().diff(moment().startOf("week"), "days");
    }

    const queryRange = Math.round((dayRangeBoundary * 3) / 10) * 10; // query longer range to be able to display exact date of last note for recent

    // recent notes are sorted ascending, without recent notes descending
    const order = mode === "with-recent-notes" ? -1 : 1;
    const filterFn =
      mode === "with-recent-notes"
        ? (stat: [string, number]) => stat[1] <= dayRangeBoundary
        : (stat: [string, number]) => stat[1] >= dayRangeBoundary;

    const recentNotesMap =
      await this.childrenService.getDaysSinceLastNoteOfEachEntity(
        this.entityDefinition().ENTITY_TYPE,
        queryRange,
      );
    const entries = Array.from(recentNotesMap)
      .filter(filterFn)
      .map((stat) => statsToEntityWithRecentNoteInfo(stat, queryRange))
      .sort((a, b) => order * (b.daysSinceLastNote - a.daysSinceLastNote));

    if (isCurrent()) {
      this.entries.set(entries);
    }
  }

  tooltip = computed((): string => {
    switch (this.mode()) {
      case "with-recent-notes":
        return $localize`:Tooltip|Spaces in front of the variables are added automatically:includes cases with a note${this.sinceBeginningOfTheWeek()}:sinceBeginningOfWeek:${this.withinTheLastNDays()}:withinTheLastDays:`;
      case "without-recent-notes":
        return $localize`:Tooltip|Spaces in front of the variables are added automatically:includes cases without a note${this.sinceBeginningOfTheWeek()}:sinceBeginningOfWeek:${this.withinTheLastNDays()}:withinTheLastDays:`;
      default:
        return "";
    }
  });

  private sinceBeginningOfTheWeek = computed(() => {
    if (this.fromBeginningOfWeek()) {
      return (
        " " +
        $localize`:Tooltip-part|'includes cases without a note since the beginning of the week':since the beginning of the week`
      );
    }
    return "";
  });

  private withinTheLastNDays = computed(() => {
    if (this.sinceDays() > 0) {
      return (
        " " +
        $localize`:Tooltip-part|'includes cases without a note within the last x days':without a note within the last ${this.sinceDays()} days`
      );
    }
    return "";
  });
}

/**
 * details on entity stats to be displayed
 */
interface EntityWithRecentNoteInfo {
  entityId: string;
  daysSinceLastNote: number;
  /** true when the daysSinceLastNote is not accurate but was cut off for performance optimization */
  moreThanDaysSince: boolean;
}

/**
 * Map a result entry from getDaysSinceLastNoteOfEachEntity to the EntityWithRecentNoteInfo interface
 * @param stat Array of [entityId, daysSinceLastNote]
 * @param queryRange The query range (the maximum of days that exactly calculated)
 */
function statsToEntityWithRecentNoteInfo(
  stat: [string, number],
  queryRange: number,
): EntityWithRecentNoteInfo {
  if (stat[1] < Number.POSITIVE_INFINITY) {
    return {
      entityId: stat[0],
      daysSinceLastNote: stat[1],
      moreThanDaysSince: false,
    };
  } else {
    return {
      entityId: stat[0],
      daysSinceLastNote: queryRange,
      moreThanDaysSince: true,
    };
  }
}
