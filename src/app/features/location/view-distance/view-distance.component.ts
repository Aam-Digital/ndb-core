import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ViewDirective } from "../../../core/entity-components/entity-utils/view-components/view.directive";
import { Entity } from "../../../core/entity/model/entity";
import { Coordinates } from "../coordinates";
import { getKmDistance } from "../map-utils";
import { Observable } from "rxjs";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ReadonlyFunctionComponent } from "../../../core/entity-components/entity-utils/view-components/readonly-function/readonly-function.component";

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
  standalone: true,
})
export class ViewDistanceComponent
  extends ViewDirective<Geolocation, ViewDistanceConfig>
  implements OnInit
{
  constructor(private changeDetector: ChangeDetectorRef) {
    super();
  }

  distanceFunction = (_entity: Entity) => "-";

  ngOnInit() {
    this.config.compareCoordinates
      .pipe(untilDestroyed(this))
      .subscribe((coordinates) => this.setDistanceFunction(coordinates));
  }

  private setDistanceFunction(compareCoordinates: Coordinates[]) {
    this.distanceFunction = (e: Entity) => {
      const distances = this.getAllDistances(compareCoordinates, e);
      if (distances.length > 0) {
        const closest = Math.min(...distances).toFixed(2);
        return $localize`:distance with unit|e.g. 5 km:${closest} km`;
      } else {
        return "-";
      }
    };
    // somehow changes to `displayFunction` don't trigger the change detection
    this.changeDetector.detectChanges();
  }

  private getAllDistances(compareCoordinates: Coordinates[], e: Entity) {
    const results: number[] = [];
    for (const prop of this.config.coordinatesProperties) {
      for (const coord of compareCoordinates) {
        if (e[prop] && coord) {
          results.push(getKmDistance(e[prop], coord));
        }
      }
    }
    return results;
  }
}
