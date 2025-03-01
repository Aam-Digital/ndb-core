import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AddressGpsLocationComponent } from "./address-gps-location.component";
import { of } from "rxjs";
import { GeoService } from "../geo.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AddressGpsLocationComponent", () => {
  let component: AddressGpsLocationComponent;
  let fixture: ComponentFixture<AddressGpsLocationComponent>;

  let mockGeoService: jasmine.SpyObj<GeoService>;

  beforeEach(async () => {
    mockGeoService = jasmine.createSpyObj(["lookup", "reverseLookup"]);
    mockGeoService.reverseLookup.and.returnValue(
      of({
        error: "Unable to geocode",
      } as any),
    );

    await TestBed.configureTestingModule({
      imports: [AddressGpsLocationComponent, FontAwesomeTestingModule],
      providers: [{ provide: GeoService, useValue: mockGeoService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AddressGpsLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
