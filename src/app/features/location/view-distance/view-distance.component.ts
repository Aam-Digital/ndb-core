import { ChangeDetectorRef, Component, OnInit, inject } from "@angular/core";
import { ViewDirective } from "../../../core/entity/default-datatype/view.directive";
import { Entity } from "../../../core/entity/model/entity";
import { Coordinates } from "../coordinates";
import { getMinDistanceKm } from "../map-utils";
import { Observable } from "rxjs";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ReadonlyFunctionComponent } from "../../../core/common-components/display-readonly-function/readonly-function.component";

/**
 * Config for displaying the distance between two entities
 */
export interface ViewDistanceConfig {
  /**
   * The name of the `GeoResult`/`Coordinates` property of the first entity
   */
  coordinatesProperties: string[];
  /**
   * The updates of coordinates of the second entity.
   * A `ReplaySubject` works best for this.
   */
  compareCoordinates: Observable<Coordinates[]>;
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
      [config]="distanceFunction"
    ></app-readonly-function>
  `,
  imports: [ReadonlyFunctionComponent],
})
export class ViewDistanceComponent
  extends ViewDirective<Geolocation, ViewDistanceConfig>
  implements OnInit
{
  private changeDetector = inject(ChangeDetectorRef);

  distanceFunction = (_entity: Entity) => "-";

  ngOnInit() {
    this.config.compareCoordinates
      .pipe(untilDestroyed(this))
      .subscribe((coordinates) => this.setDistanceFunction(coordinates));
  }

  private setDistanceFunction(compareCoordinates: Coordinates[]) {
    this.distanceFunction = (e: Entity) => {
      const closest = getMinDistanceKm(
        e,
        this.config.coordinatesProperties ?? [],
        compareCoordinates,
      );
      if (closest === null) {
        return "-";
      }
      return $localize`:distance with unit|e.g. 5 km:${closest.toFixed(2)} km`;
    };
    // somehow changes to `displayFunction` don't trigger the change detection
    this.changeDetector.detectChanges();
  }
}
