import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ConfigurableEnumValue } from "../../../../core/configurable-enum/configurable-enum.interface";
import { Child } from "../../model/child";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Entity } from "../../../../core/entity/model/entity";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { MatTableModule } from "@angular/material/table";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Angulartics2Module } from "angulartics2";
import { DashboardWidgetComponent } from "../../../../core/dashboard/dashboard-widget/dashboard-widget.component";
import { WidgetContentComponent } from "../../../../core/dashboard/dashboard-widget/widget-content/widget-content.component";

@DynamicComponent("ChildrenCountDashboard")
@DynamicComponent("EntityCountDashboard")
@Component({
  selector: "app-entity-count-dashboard",
  templateUrl: "./entity-count-dashboard.component.html",
  styleUrls: ["./entity-count-dashboard.component.scss"],
  imports: [
    MatTableModule,
    FontAwesomeModule,
    Angulartics2Module,
    DashboardWidgetComponent,
    WidgetContentComponent,
  ],
  standalone: true,
})
export class EntityCountDashboardComponent
  implements OnInitDynamicComponent, OnInit
{
  private entity = Child.ENTITY_TYPE;
  /**
   * The property of the Child entities to group counts by.
   *
   * Default is "center".
   */
  private groupBy = "center";

  totalEntities: number;
  entityGroupCounts: { label: string; value: number; id: string }[] = [];
  loading = true;
  label = Child.labelPlural;
  entityIcon: IconName = Child.icon;

  constructor(
    private entityMapper: EntityMapperService,
    private router: Router,
    private entities: EntityRegistry
  ) {}

  onInitFromDynamicConfig(config: any) {
    this.groupBy = config?.groupBy ?? this.groupBy;
    if (config?.entity) {
      this.entity = config?.entity ?? this.entity;
      this.label = this.entities.get(this.entity).labelPlural;
      this.entityIcon = this.entities.get(this.entity).icon;
    }
  }

  async ngOnInit() {
    const entities = await this.entityMapper.loadType(this.entity);
    this.updateCounts(entities);
  }

  goToChildrenList(filterId: string) {
    const params = {};
    params[this.groupBy] = filterId;

    this.router.navigate([Child.route], { queryParams: params });
  }

  private updateCounts(entities: Entity[]) {
    this.totalEntities = 0;

    const countMap = new Map<any, number>();
    entities.forEach((entity) => {
      if (entity.isActive) {
        let count = countMap.get(entity[this.groupBy]);
        if (count === undefined) {
          count = 0;
        }

        count++;
        this.totalEntities++;
        countMap.set(entity[this.groupBy], count);
      }
    });

    this.entityGroupCounts = Array.from(countMap.entries()) // direct use of Map creates change detection problems
      .map((entry) => {
        const label = extractHumanReadableLabel(entry[0]);
        return {
          label: label,
          value: entry[1],
          id: entry[0]?.id || label,
        };
      });
    this.loading = false;
  }
}

/**
 * Get a human-readable string from the given value as a label.
 * @param value
 */
function extractHumanReadableLabel(
  value: string | ConfigurableEnumValue | any
): string {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (value?.label) {
    return value.label;
  }

  return String(value);
}
