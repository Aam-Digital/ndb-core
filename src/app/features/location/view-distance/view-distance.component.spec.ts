import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ViewDistanceComponent } from "./view-distance.component";
import { Child } from "../../../child-dev-project/children/model/child";
import { Subject } from "rxjs";
import { Coordinates } from "../coordinates";
import { GeoLocation } from "../location.datatype";

describe("ViewDistanceComponent", () => {
  let component: ViewDistanceComponent;
  let fixture: ComponentFixture<ViewDistanceComponent>;
  let compareCoordinates: Subject<Coordinates[]>;
  let entity: Child;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewDistanceComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ViewDistanceComponent);

    entity = new Child();
    entity["address"] = { geoLookup: { lat: 52, lon: 13 } } as GeoLocation;
    compareCoordinates = new Subject();
    component = fixture.componentInstance;
    component.id = "distance";
    component.entity = entity;
    component.value = undefined;
    component.config = {
      compareCoordinates,
      coordinatesProperties: ["address", "otherAddress"],
    };

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display a dash if no address is set", () => {
    entity["address"] = undefined;
    compareCoordinates.next([{ lat: 52.0001, lon: 13 }]);

    expect(component.distanceFunction(entity)).toBe("-");
  });

  it("update function and trigger change detection when new coordinates are emitted", () => {
    const detectChangesSpy = spyOn(
      component["changeDetector"],
      "detectChanges",
    );

    compareCoordinates.next([{ lat: 52.0001, lon: 13 }]);
    expect(detectChangesSpy).toHaveBeenCalledTimes(1);
    expect(component.distanceFunction(entity)).toBe("0.01 km");

    compareCoordinates.next([{ lat: 52.001, lon: 13 }]);
    expect(detectChangesSpy).toHaveBeenCalledTimes(2);
    expect(component.distanceFunction(entity)).toBe("0.11 km");
  });

  it("should display the shortest distance", () => {
    entity["otherAddress"] = { geoLookup: { lat: 52, lon: 14 } } as GeoLocation;
    const c1 = { lat: 53, lon: 14 };
    const c2 = { lat: 52.0001, lon: 14 };
    compareCoordinates.next([c1, c2]);

    expect(component.distanceFunction(entity)).toBe("0.01 km");
  });
});
