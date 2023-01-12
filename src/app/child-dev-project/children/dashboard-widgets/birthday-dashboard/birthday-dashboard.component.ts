import { Component, AfterViewInit, OnInit, ViewChild } from "@angular/core";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Child } from "../../model/child";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { Entity } from "../../../../core/entity/model/entity";
import { DatePipe, NgIf } from "@angular/common";
import { DisplayEntityComponent } from "../../../../core/entity-components/entity-select/display-entity/display-entity.component";
import { DashboardWidgetComponent } from "../../../../core/dashboard/dashboard-widget/dashboard-widget.component";
import { WidgetContentComponent } from "../../../../core/dashboard/dashboard-widget/widget-content/widget-content.component";

@DynamicComponent("BirthdayDashboard")
@Component({
  selector: "app-birthday-dashboard",
  templateUrl: "./birthday-dashboard.component.html",
  styleUrls: ["./birthday-dashboard.component.scss"],
  imports: [
    NgIf,
    MatTableModule,
    DisplayEntityComponent,
    DatePipe,
    MatPaginatorModule,
    DashboardWidgetComponent,
    WidgetContentComponent,
  ],
  standalone: true,
})
export class BirthdayDashboardComponent
  implements OnInitDynamicComponent, OnInit, AfterViewInit
{
  @ViewChild(MatPaginator) paginator: MatPaginator;
  private readonly today: Date;
  private entities: EntityPropertyMap = { [Child.ENTITY_TYPE]: "dateOfBirth" };
  birthdayThreshold = 32;
  dataSource = new MatTableDataSource<EntityWithBirthday>();
  isLoading = true;

  constructor(private entityMapper: EntityMapperService) {
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);
  }

  onInitFromDynamicConfig(config: BirthdayDashboardConfig) {
    this.entities = config?.entities ?? this.entities;
    this.birthdayThreshold = config?.threshold ?? this.birthdayThreshold;
  }

  async ngOnInit() {
    const data: EntityWithBirthday[] = [];
    for (const [entityType, property] of Object.entries(this.entities)) {
      const entities = await this.entityMapper.loadType(entityType);
      data.push(
        ...entities
          .filter((entity) => entity.isActive && entity[property])
          .map((entity) => ({
            entity: entity,
            birthday: this.getNextBirthday(entity[property]),
            newAge: entity[property]?.age + 1,
          }))
          .filter((a) => this.daysUntil(a.birthday) < this.birthdayThreshold)
      );
    }
    data.sort(
      (a, b) => this.daysUntil(a.birthday) - this.daysUntil(b.birthday)
    );
    this.dataSource.data = data;
    this.isLoading = false;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  private getNextBirthday(dateOfBirth: Date): Date {
    const birthday = new Date(
      this.today.getFullYear(),
      dateOfBirth.getMonth(),
      dateOfBirth.getDate()
    );

    if (this.today.getTime() > birthday.getTime()) {
      birthday.setFullYear(birthday.getFullYear() + 1);
    }
    return birthday;
  }

  private daysUntil(date: Date): number {
    const diff = date.getTime() - this.today.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

/**
 * Configuration object for the BirthdayDashboard
 */
interface BirthdayDashboardConfig {
  /**
   * An object holding the names of entities and properties where they have a `DateOfBirth` attribute.
   * E.g. (which is also the default)
   * ```json
   * "entities": { "Child": "dateOfBirth" }
   * ```
   */
  entities?: EntityPropertyMap;
  /**
   * Birthdays that are less than "threshold" days away are shown.
   * Default 32
   */
  threshold?: number;
}

interface EntityPropertyMap {
  [key: string]: string;
}

interface EntityWithBirthday {
  entity: Entity;
  birthday: Date;
  newAge: number;
}
