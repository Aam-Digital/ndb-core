import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { EditLocationComponent } from "./edit-location.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { setupEditComponent } from "../../../core/entity-components/entity-utils/dynamic-form-components/edit-component.spec";
import { GeoResult, GeoService } from "../geo.service";
import { of, Subject } from "rxjs";
import { HarnessLoader, TestElement } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatInputHarness } from "@angular/material/input/testing";
import { MatButtonHarness } from "@angular/material/button/testing";
import { MatDialog } from "@angular/material/dialog";
import { Coordinates } from "../coordinates";
import { MapPopupConfig } from "../map-popup/map-popup.component";

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
      imports: [EditLocationComponent, MockedTestingModule.withState()],
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

    tick(2000);
    expect(mockGeoService.lookup).not.toHaveBeenCalled();
    expect(component.loading).toBeTrue();
    await inputElement.clear();
    await inputElement.sendKeys("input 2");

    tick(1200);
    expect(mockGeoService.lookup).not.toHaveBeenCalled();
    expect(component.loading).toBeTrue();
    expect(options).toBeUndefined();

    tick(2000);
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
    await expectLookup(" ", false, inputElement);

    // object (as created by autocomplete)
    await expectLookup("[object Object]", false, inputElement);

    // same search term as last lookup
    await expectLookup("search term", true, inputElement);
    mockGeoService.lookup.calls.reset();
    await expectLookup("search term", false, inputElement);

    // value that is already set on the form
    const display_name = "already entered location";
    component.formControl.setValue({ display_name } as any);
    fixture.detectChanges();
    await expectLookup(display_name, false, inputElement);
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

  it("should open map and reverse lookup last result", () => {
    const location: Coordinates = { lat: 1, lon: 2 };
    const closeSubject = new Subject();
    mockDialog.open.and.returnValue({ afterClosed: () => closeSubject } as any);
    const fullLocation = { display_name: "lookup result", ...location };
    mockGeoService.reverseLookup.and.returnValue(of(fullLocation));

    component.openMap();

    const dialogData: MapPopupConfig =
      mockDialog.open.calls.mostRecent().args[1].data;
    dialogData.mapClick.next(location);

    expect(mockGeoService.reverseLookup).not.toHaveBeenCalledWith(location);
    expect(component.formControl).not.toHaveValue(fullLocation);

    closeSubject.next(undefined);

    expect(mockGeoService.reverseLookup).toHaveBeenCalledWith(location);
    expect(component.formControl).toHaveValue(fullLocation);
  });

  it("should not send a request if nothing changed", () => {
    const coordinates = { lat: 1, lon: 2, display_name: "" };
    component.formControl.setValue(coordinates);
    mockDialog.open.and.returnValue({
      afterClosed: () => of({ lat: 1, lon: 1 }),
    } as any);

    component.openMap();

    expect(mockGeoService.reverseLookup).not.toHaveBeenCalled();
    expect(component.formControl).toHaveValue(coordinates);
  });

  async function expectLookup(
    searchTerm: string,
    lookupCalled: boolean,
    input: TestElement
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
