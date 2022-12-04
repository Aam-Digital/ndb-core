import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { EditLocationComponent } from "./edit-location.component";
import { LocationModule } from "../location.module";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { setupEditComponent } from "../../../core/entity-components/entity-utils/dynamic-form-components/edit-component.spec";
import { GeoResult, GeoService } from "../geo.service";
import { of } from "rxjs";
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatInputHarness } from "@angular/material/input/testing";
import { MatButtonHarness } from "@angular/material/button/testing";
import { MatDialog } from "@angular/material/dialog";
import { Coordinates } from "../coordinates";

describe("EditLocationComponent", () => {
  let component: EditLocationComponent;
  let fixture: ComponentFixture<EditLocationComponent>;
  let mockGeoService: jasmine.SpyObj<GeoService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    mockGeoService = jasmine.createSpyObj(["lookup", "reverseLookup"]);
    mockGeoService.lookup.and.returnValue(of([]));
    mockDialog = jasmine.createSpyObj(["open"]);
    await TestBed.configureTestingModule({
      imports: [LocationModule, MockedTestingModule.withState()],
      providers: [
        { provide: GeoService, useValue: mockGeoService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditLocationComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    setupEditComponent(component);
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

    tick(900);
    expect(mockGeoService.lookup).not.toHaveBeenCalled();
    expect(component.loading).toBeTrue();
    await inputElement.clear();
    await inputElement.sendKeys("input 2");

    tick(300);
    expect(mockGeoService.lookup).not.toHaveBeenCalled();
    expect(component.loading).toBeTrue();
    expect(options).toBeUndefined();

    tick(900);
    expect(mockGeoService.lookup).toHaveBeenCalledWith("input 2");
    expect(mockGeoService.lookup).not.toHaveBeenCalledWith("input 1");
    expect(component.loading).toBeFalse();
    expect(options).toEqual([location]);
  }));

  it("should not call lookup service for trivial inputs", fakeAsync(async () => {
    const inputElement = await loader
      .getHarness(MatInputHarness)
      .then((el) => el.host());

    // empty input
    await inputElement.sendKeys(" ");
    tick(1200);
    expect(mockGeoService.lookup).not.toHaveBeenCalled();

    // object (as created by autocomplete)
    await inputElement.clear();
    await inputElement.sendKeys("[object Object]");
    tick(1200);
    expect(mockGeoService.lookup).not.toHaveBeenCalled();

    // same search term as last lookup
    await inputElement.clear();
    await inputElement.sendKeys("search term");
    tick(1200);
    expect(mockGeoService.lookup).toHaveBeenCalled();
    mockGeoService.lookup.calls.reset();
    await inputElement.clear();
    await inputElement.sendKeys("search term");
    tick(1200);
    expect(mockGeoService.lookup).not.toHaveBeenCalled();

    // value that is already set on the form
    const display_name = "already entered location";
    component.formControl.setValue({ display_name } as any);
    fixture.detectChanges();
    await inputElement.clear();
    await inputElement.sendKeys(display_name);
    tick(1200);
    expect(mockGeoService.lookup).not.toHaveBeenCalled();
  }));

  it("should reset form and input when clicking x", async () => {
    // First button is cancel button
    const clearButton = (await loader.getAllHarnesses(MatButtonHarness))[0];
    const input = await loader.getHarness(MatInputHarness);
    component.formControl.setValue({ display_name: "some value" } as any);
    await expectAsync(input.getValue()).toBeResolvedTo("some value");

    await clearButton.click();

    expect(component.formControl.value).toBeNull();
    await expectAsync(input.getValue()).toBeResolvedTo("");
  });

  xit("should reset input if nothing was clicked on", async () => {
    // test only works headless or if browser is focused
    const initial = { display_name: "initial value" } as GeoResult;
    component.formControl.setValue(initial);
    const input = await loader.getHarness(MatInputHarness);
    await expectAsync(input.getValue()).toBeResolvedTo(initial.display_name);

    await input.setValue("some value");
    await expectAsync(input.getValue()).toBeResolvedTo("some value");

    await input.blur();
    await expectAsync(input.getValue()).toBeResolvedTo(initial.display_name);
  });

  it("should update form if value is selected", async () => {
    const input = await loader.getHarness(MatInputHarness);
    const selected = { display_name: "selected" } as GeoResult;

    component.selectLocation(selected);

    await expectAsync(input.getValue()).toBeResolvedTo(selected.display_name);
    expect(component.formControl).toHaveValue(selected);
  });

  it("should open map and reverse lookup returned result", () => {
    const location: Coordinates = { lat: 1, lon: 2 };
    mockDialog.open.and.returnValue({ afterClosed: () => of(location) } as any);
    const fullLocation = { display_name: "lookup result", ...location };
    mockGeoService.reverseLookup.and.returnValue(of(fullLocation));

    component.openMap();

    expect(mockGeoService.reverseLookup).toHaveBeenCalledWith(location);
    expect(component.formControl).toHaveValue(fullLocation);
  });
});
