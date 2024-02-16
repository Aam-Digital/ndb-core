import { Component, Input, OnInit } from "@angular/core";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { Child } from "../../../../child-dev-project/children/model/child";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { MatTableModule } from "@angular/material/table";
import { Entity } from "../../../../core/entity/model/entity";
import { DatePipe, NgIf } from "@angular/common";
import { DisplayEntityComponent } from "../../../../core/basic-datatypes/entity/display-entity/display-entity.component";

import { DashboardWidget } from "../../../../core/dashboard/dashboard-widget/dashboard-widget";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";

interface BirthdayDashboardConfig {
  entities: EntityPropertyMap;
  threshold: number;
}

@DynamicComponent("BirthdayDashboard")
@Component({
  selector: "app-birthday-dashboard",
  templateUrl: "./birthday-dashboard.component.html",
  styleUrls: ["./birthday-dashboard.component.scss"],
  standalone: true,
  imports: [
    NgIf,
    MatTableModule,
    DisplayEntityComponent,
    DatePipe,
    DashboardListWidgetComponent,
  ],
})
export class BirthdayDashboardComponent
  extends DashboardWidget
  implements BirthdayDashboardConfig, OnInit
{
  static getRequiredEntities(config: BirthdayDashboardConfig) {
    return config?.entities ? Object.keys(config.entities) : Child.ENTITY_TYPE;
  }

  private readonly today: Date;

  /**
   * An object holding the names of entities and properties where they have a `DateOfBirth` attribute.
   * E.g. (which is also the default)
   * ```json
   * "entities": { "Child": "dateOfBirth" }
   * ```
   */
  @Input() entities: EntityPropertyMap = { [Child.ENTITY_TYPE]: "dateOfBirth" };

  /**
   * Birthdays that are less than "threshold" days away are shown.
   * Default 32
   */
  @Input() threshold = 32;

  entries: EntityWithBirthday[];

  constructor(private entityMapper: EntityMapperService) {
    super();
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);
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
          .filter((a) => this.daysUntil(a.birthday) < this.threshold),
      );
    }
    data.sort(
      (a, b) => this.daysUntil(a.birthday) - this.daysUntil(b.birthday),
    );
    this.entries = data;
  }

  private getNextBirthday(dateOfBirth: Date): Date {
    const birthday = new Date(
      this.today.getFullYear(),
      dateOfBirth.getMonth(),
      dateOfBirth.getDate(),
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

interface EntityPropertyMap {
  [key: string]: string;
}

interface EntityWithBirthday {
  entity: Entity;
  birthday: Date;
  newAge: number;
}
