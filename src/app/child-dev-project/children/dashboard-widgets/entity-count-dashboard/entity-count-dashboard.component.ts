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
import { groupBy } from "../../../../utils/utils";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";

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
    DashboardListWidgetComponent,
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
    this.updateCounts(entities.filter((e) => e.isActive));
  }

  goToChildrenList(filterId: string) {
    const params = {};
    params[this.groupBy] = filterId;

    this.router.navigate([Child.route], { queryParams: params });
  }

  private updateCounts(entities: Entity[]) {
    this.totalEntities = entities.length;
    const groups = groupBy(entities, this.groupBy as keyof Entity);
    this.entityGroupCounts = groups.map(([group, entities]) => {
      const label = extractHumanReadableLabel(group);
      return {
        label: label,
        value: entities.length,
        id: group?.["id"] || label,
      };
    });
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
