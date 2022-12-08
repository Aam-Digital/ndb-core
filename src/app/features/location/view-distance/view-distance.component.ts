import { ChangeDetectorRef, Component } from "@angular/core";
import { ViewDirective } from "../../../core/entity-components/entity-utils/view-components/view.directive";
import { ViewPropertyConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { Entity } from "../../../core/entity/model/entity";
import { Coordinates } from "../coordinates";
import { getKmDistance } from "../map-utils";
import { Observable } from "rxjs";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

/**
 * Config for displaying the distance between two entities
 */
export interface ViewDistanceConfig {
  /**
   * The name of the `GeoResult`/`Coordinates` property of the first entity
   */
  coordinatesProperty: string;
  /**
   * The updates of coordinates of the second entity.
   * A `ReplaySubject` works best for this.
   */
  compareCoordinates: Observable<Coordinates>;
}

/**
 * Displays the distance between two entities
 */
@UntilDestroy()
@DynamicComponent("DisplayDistance")
@Component({
  selector: "app-view-distance",
  template: `
    <app-readonly-function
      [entity]="entity"
      [displayFunction]="distanceFunction"
    ></app-readonly-function>
  `,
})
export class ViewDistanceComponent extends ViewDirective<Geolocation> {
  private config: ViewDistanceConfig;

  constructor(private changeDetector: ChangeDetectorRef) {
    super();
  }

  distanceFunction = (_entity: Entity) => "-";

  onInitFromDynamicConfig(config: ViewPropertyConfig<ViewDistanceConfig>) {
    super.onInitFromDynamicConfig(config);
    this.config = config.config;
    this.config.compareCoordinates
      .pipe(untilDestroyed(this))
      .subscribe((coordinates) => this.setDistanceFunction(coordinates));
  }

  private setDistanceFunction(compareCoordinates: Coordinates) {
    this.distanceFunction = (e: Entity) =>
      this.calculateDistanceTo(
        e[this.config.coordinatesProperty],
        compareCoordinates
      );
    // somehow changes to `displayFunction` don't trigger the change detection
    this.changeDetector.detectChanges();
  }

  private calculateDistanceTo(a: Coordinates, b: Coordinates) {
    if (a && b && a !== b) {
      const res = getKmDistance(a, b).toFixed(2);
      return $localize`:distance with unit|e.g. 5 km:${res} km`;
    } else {
      return "-";
    }
  }
}
