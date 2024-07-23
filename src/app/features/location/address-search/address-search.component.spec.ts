import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { AddressSearchComponent } from "./address-search.component";
import { GeoResult, GeoService } from "../geo.service";
import { HarnessLoader, TestElement } from "@angular/cdk/testing";
import { of } from "rxjs";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatInputHarness } from "@angular/material/input/testing";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { GeoLocation } from "../location.datatype";

describe("AddressSearchComponent", () => {
  let component: AddressSearchComponent;
  let fixture: ComponentFixture<AddressSearchComponent>;

  let mockGeoService: jasmine.SpyObj<GeoService>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    mockGeoService = jasmine.createSpyObj(["lookup", "reverseLookup"]);
    mockGeoService.lookup.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        AddressSearchComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [{ provide: GeoService, useValue: mockGeoService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AddressSearchComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should only lookup results after 1s of not typing", fakeAsync(async () => {
    const location: GeoResult = { lat: 0, lon: 0, display_name: "testRes" };
    mockGeoService.lookup.and.returnValue(of([location]));
    let options;
    component.filteredOptions.subscribe((res) => (options = res));
    const inputElement = await loader
      .getHarness(MatInputHarness)
      .then((el) => el.host());

    await inputElement.sendKeys("input 1");
    expect(mockGeoService.lookup).not.toHaveBeenCalled();
    expect(component.loading).toBeFalse();

    tick(2000);
    expect(mockGeoService.lookup).not.toHaveBeenCalled();
    expect(component.loading).toBeFalse();

    // change input before debounce --> restarts timeouts
    await inputElement.clear();
    await inputElement.sendKeys("input 2");

    tick(700);
    expect(mockGeoService.lookup).not.toHaveBeenCalled();
    expect(component.loading).toBeFalse();
    expect(options).toBeUndefined();

    tick(2000);
    expect(mockGeoService.lookup).toHaveBeenCalledWith("input 2");
    expect(mockGeoService.lookup).not.toHaveBeenCalledWith("input 1");
    expect(component.loading).toBeFalse();
    expect(options).toEqual([location]);
  }));

  it("should not call lookup service for trivial inputs or same term", fakeAsync(async () => {
    const inputElement = await loader
      .getHarness(MatInputHarness)
      .then((el) => el.host());

    // empty input
    await expectLookup(" ", false, inputElement);

    // object (as created by autocomplete)
    await expectLookup("[object Object]", false, inputElement);

    // same search term as last lookup
    await expectLookup("search term", true, inputElement);
    mockGeoService.lookup.calls.reset();
    await expectLookup("search term", false, inputElement);
  }));

  it("should emit new location if value is selected and clear search field", async () => {
    const input = await loader.getHarness(MatInputHarness);
    const selected = { display_name: "selected" } as GeoResult;
    spyOn(component.locationSelected, "emit");

    component.selectLocation(selected);

    expect(component.locationSelected.emit).toHaveBeenCalledWith({
      geoLookup: selected,
    } as GeoLocation);
    await expectAsync(input.getValue()).toBeResolvedTo("");
  });

  async function expectLookup(
    searchTerm: string,
    lookupCalled: boolean,
    input: TestElement,
  ) {
    await input.clear();
    await input.sendKeys(searchTerm);
    tick(3200);
    if (lookupCalled) {
      expect(mockGeoService.lookup).toHaveBeenCalled();
    } else {
      expect(mockGeoService.lookup).not.toHaveBeenCalled();
    }
  }
});
