import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { ChildrenService } from "../../../children/children.service";
import moment from "moment";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { Child } from "../../../children/model/child";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { EntityConstructor } from "../../../../core/entity/model/entity";
import { DecimalPipe, NgIf } from "@angular/common";
import { DisplayEntityComponent } from "../../../../core/entity-components/entity-select/display-entity/display-entity.component";

/**
 * Dashboard Widget displaying entities that do not have a recently added Note.
 *
 * If you do not set "sinceDays" of "fromBeginningOfWeek" inputs
 * by default notes since beginning of the current week are considered.
 */
@DynamicComponent("NotesDashboard")
@Component({
  selector: "app-no-recent-notes-dashboard",
  templateUrl: "./notes-dashboard.component.html",
  styleUrls: ["./notes-dashboard.component.scss"],
  imports: [
    NgIf,
    MatTableModule,
    DisplayEntityComponent,
    DecimalPipe,
    MatPaginatorModule,
  ],
  standalone: true,
})
export class NotesDashboardComponent
  implements OnInitDynamicComponent, OnInit, AfterViewInit
{
  /**
   * Entity for which the recent notes should be counted.
   */
  entity: EntityConstructor = Child;

  /**
   * number of days since last note that entities should be considered having a "recent" note.
   */
  sinceDays = 0;

  /** Whether an additional offset should be automatically added to include notes from the beginning of the week */
  fromBeginningOfWeek = true;

  mode: "with-recent-notes" | "without-recent-notes";

  /**
   * Entities displayed in the template with additional "daysSinceLastNote" field
   */
  dataSource = new MatTableDataSource<EntityWithRecentNoteInfo>();

  subtitle: string;

  @ViewChild("paginator") paginator: MatPaginator;

  isLoading = true;

  constructor(
    private childrenService: ChildrenService,
    private entities: EntityRegistry
  ) {}

  onInitFromDynamicConfig(config: NotesDashboardConfig) {
    this.sinceDays = config.sinceDays ?? this.sinceDays;
    this.fromBeginningOfWeek =
      config.fromBeginningOfWeek ?? this.fromBeginningOfWeek;
    this.mode = config.mode;
    if (config.entity) {
      this.entity = this.entities.get(config.entity);
    }
  }

  ngOnInit() {
    let dayRangeBoundary = this.sinceDays;
    if (this.fromBeginningOfWeek) {
      dayRangeBoundary += moment().diff(moment().startOf("week"), "days");
    }
    switch (this.mode) {
      case "with-recent-notes":
        this.loadConcernedEntities(
          (stat) => stat[1] <= dayRangeBoundary,
          dayRangeBoundary
        );
        this.subtitle = $localize`:Subtitle|Subtitle informing the user that these are the entities with recent reports:${this.entity.labelPlural} with recent report`;
        break;
      case "without-recent-notes":
        this.loadConcernedEntities(
          (stat) => stat[1] >= dayRangeBoundary,
          dayRangeBoundary
        );
        this.subtitle = $localize`:Subtitle|Subtitle informing the user that these are the entities without recent reports:${this.entity.labelPlural} having no recent reports`;
        break;
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  private async loadConcernedEntities(
    filter: (stat: [string, number]) => boolean,
    dayRangeBoundary: number
  ) {
    const queryRange = Math.round((dayRangeBoundary * 3) / 10) * 10; // query longer range to be able to display exact date of last note for recent

    // recent notes are sorted ascending, without recent notes descending
    const order = this.mode === "with-recent-notes" ? -1 : 1;
    const recentNotesMap =
      await this.childrenService.getDaysSinceLastNoteOfEachEntity(
        this.entity.ENTITY_TYPE,
        queryRange
      );
    this.dataSource.data = Array.from(recentNotesMap)
      .filter(filter)
      .map((stat) => statsToEntityWithRecentNoteInfo(stat, queryRange))
      .sort((a, b) => order * (b.daysSinceLastNote - a.daysSinceLastNote));

    this.isLoading = false;
  }

  get tooltip(): string {
    switch (this.mode) {
      case "with-recent-notes":
        return $localize`:Tooltip|Spaces in front of the variables are added automatically:includes cases with a note${this.sinceBeginningOfTheWeek}:sinceBeginningOfWeek:${this.withinTheLastNDays}:withinTheLastDays:`;
      case "without-recent-notes":
        return $localize`:Tooltip|Spaces in front of the variables are added automatically:includes cases without a note${this.sinceBeginningOfTheWeek}:sinceBeginningOfWeek:${this.withinTheLastNDays}:withinTheLastDays:`;
    }
  }

  get sinceBeginningOfTheWeek(): string {
    if (this.fromBeginningOfWeek) {
      return (
        " " +
        $localize`:Tooltip-part|'includes cases without a note since the beginning of the week':since the beginning of the week`
      );
    }
  }

  get withinTheLastNDays(): string {
    if (this.sinceDays > 0) {
      return (
        " " +
        $localize`:Tooltip-part|'includes cases without a note within the last x days':without a note within the last ${this.sinceDays} days`
      );
    }
  }
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
  queryRange: number
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

/**
 * Config for the Notes Dashboard
 * For more information see the property comments in this class
 */
interface NotesDashboardConfig {
  sinceDays?: number;
  fromBeginningOfWeek?: boolean;
  mode?: "with-recent-notes" | "without-recent-notes";
  entity?: string;
}
