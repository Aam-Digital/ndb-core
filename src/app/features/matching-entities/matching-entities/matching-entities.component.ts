import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { Entity, EntityConstructor } from "../../../core/entity/model/entity";
import { addAlphaToHexColor } from "../../../utils/utils";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import {
  MatchingEntitiesConfig,
  MatchingSideConfig,
  NewMatchAction,
} from "./matching-entities-config";
import { DataFilter } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { RouteTarget } from "../../../app.routing";
import { RouteData } from "../../../core/view/dynamic-routing/view-config.interface";
import { ActivatedRoute } from "@angular/router";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";

interface MatchingSide extends Omit<MatchingSideConfig, "entityType"> {
  /** pass along filters from app-filter to subrecord component */
  filterObj?: DataFilter<Entity>;
  availableEntities?: Entity[];
  selectMatch?: (e: Entity) => void;
  entityType?: EntityConstructor;
  selected?: Entity;
}

@RouteTarget("MatchingEntities")
@DynamicComponent("MatchingEntities")
@Component({
  selector: "app-matching-entities",
  templateUrl: "./matching-entities.component.html",
  styleUrls: ["./matching-entities.component.scss"],
})
export class MatchingEntitiesComponent
  implements OnInit, OnInitDynamicComponent
{
  @Input() entity: Entity;

  @Input() set leftSide(config: MatchingSideConfig) {
    this._leftSide = this.initSideConfig(config);
  }

  @Input() set rightSide(config: MatchingSideConfig) {
    this._rightSide = this.initSideConfig(config);
  }

  private initSideConfig(config: MatchingSideConfig): MatchingSide {
    const entityType = config.entityType
      ? this.entityRegistry.get(config.entityType)
      : undefined;
    return {
      entityType,
      prefilter: config.prefilter,
      availableFilters: config.availableFilters,
      columns: config.columns,
    };
  }

  _leftSide: MatchingSide = {};
  _rightSide: MatchingSide = {};
  mapEntities: { entity: Entity; property: string }[] = [];

  columnsToDisplay = [];

  /**
   * Column mapping of property pairs of left and right entity that should be compared side by side.
   * @param value
   */
  @Input() columns: [string, string][];

  @Input() showMap: [string, string];

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
    private entityRegistry: EntityRegistry
  ) {}

  // TODO: fill selection on hover already?

  onInitFromDynamicConfig(config: PanelConfig<MatchingEntitiesConfig>) {
    this.initConfig(config.config, config.entity);
  }

  async ngOnInit() {
    this.route?.data?.subscribe((data: RouteData<MatchingEntitiesConfig>) => {
      if (!data?.config?.onMatch) {
        return;
      }
      this.initConfig(data.config);
    });

    this.sideDetails = [
      await this.initSideDetails(this._leftSide, 0),
      await this.initSideDetails(this._rightSide, 1),
    ];
    this.columnsToDisplay = ["side-0", "side-1"];
  }

  private initConfig(config: MatchingEntitiesConfig, entity?: Entity) {
    this.columns = config.columns ?? this.columns;
    this.showMap = config.showMap ?? this.showMap;
    this.matchActionLabel = config.matchActionLabel ?? this.matchActionLabel;
    this.onMatch = config.onMatch ?? this.onMatch;

    if (config.leftSide) {
      this.rightSide = config.leftSide;
    }
    if (config.rightSide) {
      this.rightSide = config.rightSide;
    }

    this.entity = entity;
  }

  private async initSideDetails(
    side: MatchingSide,
    sideIndex: number
  ): Promise<MatchingSide> {
    const newSide = side as MatchingSide; // we are transforming it into this type here

    if (!newSide.entityType) {
      newSide.selected = newSide.selected ?? this.entity;
    }

    newSide.columns =
      newSide.columns ??
      this.columns?.map((p) => p[sideIndex]).filter((c) => !!c);

    newSide.selectMatch = (e) => {
      this.highlightSelectedRow(e, newSide.selected);
      newSide.selected = e;
      this.matchComparisonElement.nativeElement.scrollIntoView();
    };

    if (!newSide.selected && newSide.entityType) {
      newSide.availableEntities = await this.entityMapper.loadType(
        newSide.entityType
      );
      this.mapEntities = this.mapEntities.concat(
        newSide.availableEntities.map((entity) => ({
          entity,
          property: this.showMap[sideIndex],
        }))
      );
      newSide.availableFilters = newSide.availableFilters ?? [];
      this.applySelectedFilters(newSide, {});
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

    newMatchEntity[this.onMatch.newEntityMatchPropertyLeft] =
      this._leftSide.selected.getId(false);
    newMatchEntity[this.onMatch.newEntityMatchPropertyRight] =
      this._rightSide.selected.getId(false);

    // best guess properties (if they do not exist on the specific entity, the values will be discarded during save
    newMatchEntity["date"] = new Date();
    newMatchEntity["start"] = new Date();
    newMatchEntity["name"] = `${
      newMatchEntity.getConstructor().label
    } ${this._leftSide.selected.toString()} - ${this._rightSide.selected.toString()}`;

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
    if (entity.getType() === this._leftSide.entityType?.ENTITY_TYPE) {
      this._leftSide.selectMatch(entity);
    } else if (entity.getType() === this._rightSide.entityType?.ENTITY_TYPE) {
      this._rightSide.selectMatch(entity);
    }
  }
}
