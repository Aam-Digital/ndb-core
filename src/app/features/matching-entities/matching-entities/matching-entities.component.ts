import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { Entity, EntityConstructor } from "../../../core/entity/model/entity";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import {
  MatchingEntitiesConfig,
  MatchingSideConfig,
  NewMatchAction,
} from "./matching-entities-config";
import {
  ColumnConfig,
  DataFilter,
} from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { RouteTarget } from "../../../app.routing";
import { RouteData } from "../../../core/view/dynamic-routing/view-config.interface";
import { ActivatedRoute } from "@angular/router";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { addAlphaToHexColor } from "../../../utils/style-utils";
import { ReplaySubject } from "rxjs";
import { ConfigService } from "../../../core/config/config.service";
import { MatTableModule } from "@angular/material/table";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgForOf, NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { EntityPropertyViewComponent } from "../../../core/entity-components/entity-utils/entity-property-view/entity-property-view.component";
import { EntitySubrecordComponent } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { LocationEntity, MapComponent } from "../../location/map/map.component";
import { FilterComponent } from "../../../core/filter/filter/filter.component";

interface MatchingSide extends MatchingSideConfig {
  /** pass along filters from app-filter to subrecord component */
  filterObj?: DataFilter<Entity>;
  availableEntities?: Entity[];
  selectMatch?: (e) => void;
  entityType: EntityConstructor;
  selected?: Entity;
}

@RouteTarget("MatchingEntities")
@DynamicComponent("MatchingEntities")
@Component({
  selector: "app-matching-entities",
  templateUrl: "./matching-entities.component.html",
  styleUrls: ["./matching-entities.component.scss"],
  imports: [
    MatTableModule,
    FontAwesomeModule,
    MatTooltipModule,
    NgIf,
    MatButtonModule,
    NgForOf,
    EntitySubrecordComponent,
    EntityPropertyViewComponent,
    MapComponent,
    FilterComponent,
  ],
  standalone: true,
})
export class MatchingEntitiesComponent
  implements OnInit, OnInitDynamicComponent
{
  static DEFAULT_CONFIG_KEY = "appConfig:matching-entities";

  @Input() entity: Entity;

  @Input() leftSide: MatchingSideConfig = {};
  @Input() rightSide: MatchingSideConfig = {};
  mapEntities: LocationEntity[] = [];

  columnsToDisplay = [];

  /**
   * Column mapping of property pairs of left and right entity that should be compared side by side.
   * @param value
   */
  @Input() columns: [ColumnConfig, ColumnConfig][];

  @Input() showMap: [string | string[], string | string[]];

  @Input()
  matchActionLabel: string = $localize`:Matching button label:create matching`;

  @Input() onMatch: NewMatchAction;

  @ViewChild("matchComparison", { static: true })
  matchComparisonElement: ElementRef;

  lockedMatching: boolean;

  sideDetails: MatchingSide[];

  constructor(
    private route: ActivatedRoute,
    private formDialog: FormDialogService,
    private entityMapper: EntityMapperService,
    private configService: ConfigService,
    private entityRegistry: EntityRegistry
  ) {}

  // TODO: fill selection on hover already?

  onInitFromDynamicConfig(config: PanelConfig<MatchingEntitiesConfig>) {
    this.initConfig(config.config, config.entity);
  }

  async ngOnInit() {
    this.route?.data?.subscribe((data: RouteData<MatchingEntitiesConfig>) => {
      if (!data?.config?.leftSide || !data?.config?.rightSide) {
        return;
      }
      this.initConfig(data.config);
    });

    this.initDistanceColumn();
    this.sideDetails = [
      await this.initSideDetails(this.leftSide, 0),
      await this.initSideDetails(this.rightSide, 1),
    ];
    this.columnsToDisplay = ["side-0", "side-1"];
  }

  /**
   * Apply config object to the component inputs (including global default config)
   * @private
   */
  private initConfig(config: MatchingEntitiesConfig, entity?: Entity) {
    const defaultConfig = this.configService.getConfig<MatchingEntitiesConfig>(
      MatchingEntitiesComponent.DEFAULT_CONFIG_KEY
    );
    config = Object.assign({}, defaultConfig, config);

    this.columns = config.columns ?? this.columns;
    this.showMap = config.showMap ?? this.showMap;
    this.matchActionLabel = config.matchActionLabel ?? this.matchActionLabel;
    this.onMatch = config.onMatch ?? this.onMatch;

    this.leftSide = config.leftSide ?? this.leftSide;
    this.rightSide = config.rightSide ?? this.rightSide;

    this.entity = entity;
  }

  /**
   * Generate setup for a side of the matching view template based on the component input properties.
   * @param side
   * @param sideIndex
   * @private
   */
  private async initSideDetails(
    side: MatchingSideConfig,
    sideIndex: number
  ): Promise<MatchingSide> {
    const newSide = Object.assign({}, side) as MatchingSide; // we are transforming it into this type here

    if (!newSide.entityType) {
      newSide.selected = newSide.selected ?? this.entity;
      this.updateDistanceColumn(sideIndex, newSide.selected);
    }

    let entityType = newSide.entityType;
    if (typeof entityType === "string") {
      entityType = this.entityRegistry.get(entityType);
    }
    newSide.entityType = entityType ?? newSide.selected?.getConstructor();

    newSide.columns =
      newSide.columns ??
      this.columns?.map((p) => p[sideIndex]).filter((c) => !!c);

    newSide.selectMatch = (e) => {
      this.highlightSelectedRow(e, newSide.selected);
      newSide.selected = e;
      this.matchComparisonElement.nativeElement.scrollIntoView();
      this.updateDistanceColumn(sideIndex, e);
    };

    if (!newSide.selected && newSide.entityType) {
      newSide.availableEntities = await this.entityMapper.loadType(
        newSide.entityType
      );
      newSide.availableFilters = newSide.availableFilters ?? [];
      this.applySelectedFilters(newSide, {});
    }

    if (this.showMap && newSide.availableEntities) {
      this.mapEntities = this.mapEntities.concat(
        newSide.availableEntities.map((entity) => ({
          entity,
          property: this.showMap[sideIndex],
        }))
      );
    }

    return newSide;
  }

  private highlightSelectedRow(
    newSelectedEntity: Entity,
    previousSelectedEntity: Entity
  ) {
    if (previousSelectedEntity) {
      previousSelectedEntity.getColor =
        previousSelectedEntity.getConstructor().prototype.getColor;
    }
    newSelectedEntity.getColor = () =>
      addAlphaToHexColor(newSelectedEntity.getConstructor().color, 0.2);
  }

  async createMatch() {
    const newMatchEntity = new (this.entityRegistry.get(
      this.onMatch.newEntityType
    ))();
    const leftMatch = this.sideDetails[0].selected;
    const rightMatch = this.sideDetails[1].selected;

    newMatchEntity[this.onMatch.newEntityMatchPropertyLeft] =
      leftMatch.getId(false);
    newMatchEntity[this.onMatch.newEntityMatchPropertyRight] =
      rightMatch.getId(false);

    // best guess properties (if they do not exist on the specific entity, the values will be discarded during save
    newMatchEntity["date"] = new Date();
    newMatchEntity["start"] = new Date();
    newMatchEntity["name"] = `${
      newMatchEntity.getConstructor().label
    } ${leftMatch.toString()} - ${rightMatch.toString()}`;

    if (this.onMatch.columnsToReview) {
      this.formDialog
        .openSimpleForm(newMatchEntity, this.onMatch.columnsToReview)
        .afterClosed()
        .subscribe((result) => {
          if (result instanceof newMatchEntity.getConstructor()) {
            this.lockedMatching = true;
          }
        });
    } else {
      await this.entityMapper.save(newMatchEntity);
      this.lockedMatching = true;
    }
  }

  applySelectedFilters(side: MatchingSide, filter: DataFilter<Entity>) {
    side.filterObj = Object.assign({}, filter, side.prefilter ?? {});
  }

  entityInMapClicked(entity: Entity) {
    const side = this.sideDetails.find(
      (s) => s.entityType === entity.getConstructor()
    );
    if (side) {
      side.selectMatch(entity);
    }
  }

  private initDistanceColumn() {
    this.columns?.forEach((column) => {
      column.forEach((row, i) => {
        if (row === "distance") {
          column[i] = this.getDistanceColumnConfig(i);
        }
      });
    });
  }

  private getDistanceColumnConfig(index: number) {
    const mapProp = this.showMap[index];
    return {
      id: "distance",
      label: $localize`:Matching View column name:Distance`,
      view: "DisplayDistance",
      additional: {
        coordinatesProperty: Array.isArray(mapProp) ? mapProp : [mapProp],
        compareCoordinates: new ReplaySubject(),
      },
    };
  }

  private updateDistanceColumn(index: number, entity: Entity) {
    const otherIndex = (index + 1) % 2;
    this.columns?.forEach((column) => {
      const cell = column[otherIndex];
      if (typeof cell !== "string" && cell?.id === "distance") {
        const property = this.showMap[index];
        const coordProps = Array.isArray(property) ? property : [property];
        const coordinates = coordProps.map((prop) => entity[prop]);
        cell.additional.compareCoordinates.next(coordinates);
      }
    });
  }
}
