import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  ViewDistanceComponent,
  ViewDistanceConfig,
} from "./view-distance.component";
import { ReadonlyFunctionComponent } from "../../../core/entity-components/entity-utils/view-components/readonly-function/readonly-function.component";
import { EntityFunctionPipe } from "../../../core/entity-components/entity-utils/view-components/readonly-function/entity-function.pipe";
import { ViewPropertyConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { Child } from "../../../child-dev-project/children/model/child";
import { Subject } from "rxjs";
import { Coordinates } from "../coordinates";
import { ChangeDetectorRef } from "@angular/core";

describe("ViewDistanceComponent", () => {
  let component: ViewDistanceComponent;
  let fixture: ComponentFixture<ViewDistanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ViewDistanceComponent,
        ReadonlyFunctionComponent,
        EntityFunctionPipe,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewDistanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("update function and trigger change detection when new coordiantes are emitted", () => {
    const entity = new Child();
    entity["address"] = { lat: 52, lon: 13 };
    const compareCoordinates = new Subject<Coordinates>();
    const config: ViewPropertyConfig<ViewDistanceConfig> = {
      id: "distance",
      entity,
      value: undefined,
      config: { compareCoordinates, coordinatesProperty: "address" },
    };
    const detectChangesSpy = spyOn(
      component["changeDetector"],
      "detectChanges"
    );
    component.onInitFromDynamicConfig(config);

    compareCoordinates.next({ lat: 52.0001, lon: 13 });
    expect(detectChangesSpy).toHaveBeenCalledTimes(1);
    expect(component.distanceFunction(entity)).toEqual("0.01 km");

    compareCoordinates.next({ lat: 52.001, lon: 13 });
    expect(detectChangesSpy).toHaveBeenCalledTimes(2);
    expect(component.distanceFunction(entity)).toEqual("0.11 km");
  });
});
