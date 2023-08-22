import {
  AfterViewInit,
  Component,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { ChildrenService } from "../../../children/children.service";
import moment from "moment";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { Child } from "../../../children/model/child";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { EntityConstructor } from "../../../../core/entity/model/entity";
import { DecimalPipe, NgIf } from "@angular/common";
import { DisplayEntityComponent } from "../../../../core/basic-datatypes/entity/display-entity/display-entity.component";
import { DashboardWidgetComponent } from "../../../../core/dashboard/dashboard-widget/dashboard-widget.component";
import { WidgetContentComponent } from "../../../../core/dashboard/dashboard-widget/widget-content/widget-content.component";

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
    DashboardWidgetComponent,
    WidgetContentComponent,
  ],
  standalone: true,
})
export class NotesDashboardComponent implements OnInit, AfterViewInit {
  /**
   * Entity for which the recent notes should be counted.
   */
  @Input() set entity(value: string) {
    this._entity = this.entities.get(value);
  }

  _entity: EntityConstructor = Child;
  /**
   * number of days since last note that entities should be considered having a "recent" note.
   */
  @Input() sinceDays = 0;

  /** Whether an additional offset should be automatically added to include notes from the beginning of the week */
  @Input() fromBeginningOfWeek = true;

  @Input() mode: "with-recent-notes" | "without-recent-notes";

  /**
   * Entities displayed in the template with additional "daysSinceLastNote" field
   */
  dataSource = new MatTableDataSource<EntityWithRecentNoteInfo>();

  subtitle: string;

  @ViewChild("paginator") paginator: MatPaginator;

  isLoading = true;

  constructor(
    private childrenService: ChildrenService,
    private entities: EntityRegistry,
  ) {}

  ngOnInit() {
    let dayRangeBoundary = this.sinceDays;
    if (this.fromBeginningOfWeek) {
      dayRangeBoundary += moment().diff(moment().startOf("week"), "days");
    }
    switch (this.mode) {
      case "with-recent-notes":
        this.loadConcernedEntities(
          (stat) => stat[1] <= dayRangeBoundary,
          dayRangeBoundary,
        );
        this.subtitle = $localize`:Subtitle|Subtitle informing the user that these are the entities with recent reports:${this._entity.labelPlural} with recent report`;
        break;
      case "without-recent-notes":
        this.loadConcernedEntities(
          (stat) => stat[1] >= dayRangeBoundary,
          dayRangeBoundary,
        );
        this.subtitle = $localize`:Subtitle|Subtitle informing the user that these are the entities without recent reports:${this._entity.labelPlural} having no recent reports`;
        break;
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  private async loadConcernedEntities(
    filter: (stat: [string, number]) => boolean,
    dayRangeBoundary: number,
  ) {
    const queryRange = Math.round((dayRangeBoundary * 3) / 10) * 10; // query longer range to be able to display exact date of last note for recent

    // recent notes are sorted ascending, without recent notes descending
    const order = this.mode === "with-recent-notes" ? -1 : 1;
    const recentNotesMap =
      await this.childrenService.getDaysSinceLastNoteOfEachEntity(
        this._entity.ENTITY_TYPE,
        queryRange,
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
