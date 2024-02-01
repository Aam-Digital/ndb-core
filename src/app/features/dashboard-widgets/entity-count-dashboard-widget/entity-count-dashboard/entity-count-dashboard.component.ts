import { Component, Input, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ConfigurableEnumValue } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum.interface";
import { Child } from "../../../../child-dev-project/children/model/child";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import {
  Entity,
  EntityConstructor,
} from "../../../../core/entity/model/entity";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { MatTableModule } from "@angular/material/table";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Angulartics2Module } from "angulartics2";
import { groupBy } from "../../../../utils/utils";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { DashboardWidget } from "../../../../core/dashboard/dashboard-widget/dashboard-widget";
import { EntityDatatype } from "../../../../core/basic-datatypes/entity/entity.datatype";
import { EntityArrayDatatype } from "../../../../core/basic-datatypes/entity-array/entity-array.datatype";
import { DisplayEntityComponent } from "../../../../core/basic-datatypes/entity/display-entity/display-entity.component";
import { NgIf } from "@angular/common";

interface EntityCountDashboardConfig {
  entity?: string;
  groupBy?: string;
}

@DynamicComponent("ChildrenCountDashboard")
@DynamicComponent("EntityCountDashboard")
@Component({
  selector: "app-entity-count-dashboard-widget",
  templateUrl: "./entity-count-dashboard.component.html",
  styleUrls: ["./entity-count-dashboard.component.scss"],
  imports: [
    MatTableModule,
    FontAwesomeModule,
    Angulartics2Module,
    DashboardListWidgetComponent,
    DisplayEntityComponent,
    NgIf,
  ],
  standalone: true,
})
export class EntityCountDashboardComponent
  extends DashboardWidget
  implements EntityCountDashboardConfig, OnInit
{
  static getRequiredEntities(config: EntityCountDashboardConfig) {
    return config?.entity || Child.ENTITY_TYPE;
  }

  /**
   * Entity name which should be grouped
   * @param value
   */
  @Input() set entity(value: string) {
    this._entity = this.entities.get(value);
  }

  private _entity: EntityConstructor = Child;
  /**
   * The property of the Child entities to group counts by.
   *
   * Default is "center".
   */
  @Input() groupBy = "center";

  /**
   * if the groupBy field is an entity reference this holds the related entity type,
   * so that the entity block will be displayed instead of an id string,
   * otherwise undefined, to display simply the group label.
   * */
  groupedByEntity: string;

  totalEntities: number;
  entityGroupCounts: { label: string; value: number; id: string }[] = [];
  label: string;
  entityIcon: IconName;

  constructor(
    private entityMapper: EntityMapperService,
    private router: Router,
    private entities: EntityRegistry,
  ) {
    super();
  }

  async ngOnInit() {
    const groupByType = this._entity.schema.get(this.groupBy);
    this.groupedByEntity =
      groupByType.dataType === EntityDatatype.dataType ||
      groupByType.dataType === EntityArrayDatatype.dataType
        ? groupByType.additional
        : undefined;

    const entities = await this.entityMapper.loadType(this._entity);
    this.updateCounts(entities.filter((e) => e.isActive));
    this.label = this._entity.labelPlural;
    this.entityIcon = this._entity.icon;
  }

  goToChildrenList(filterId: string) {
    const params = {};
    params[this.groupBy] = filterId;

    this.router.navigate([this._entity.route], { queryParams: params });
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
  value: string | ConfigurableEnumValue | any,
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
