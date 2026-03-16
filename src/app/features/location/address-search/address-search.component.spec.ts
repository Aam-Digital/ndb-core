import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AddressSearchComponent } from "./address-search.component";
import { GeoResult, GeoService } from "../geo.service";
import { HarnessLoader, TestElement } from "@angular/cdk/testing";
import { of, throwError } from "rxjs";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatInputHarness } from "@angular/material/input/testing";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { HttpErrorResponse } from "@angular/common/http";

describe("AddressSearchComponent", () => {
  let component: AddressSearchComponent;
  let fixture: ComponentFixture<AddressSearchComponent>;

  let mockGeoService: any;
  let loader: HarnessLoader;

  beforeEach(async () => {
    mockGeoService = {
      lookup: vi.fn(),
      reverseLookup: vi.fn(),
    };
    mockGeoService.lookup.mockReturnValue(of([]));

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

  it("should only lookup results after 1s of not typing", async () => {
    vi.useFakeTimers();
    try {
      const location: GeoResult = { lat: 0, lon: 0, display_name: "testRes" };
      mockGeoService.lookup.mockReturnValue(of([location]));
      let options;
      component.filteredOptions.subscribe((res) => (options = res));
      const inputElement = await loader
        .getHarness(MatInputHarness)
        .then((el) => el.host());

      await inputElement.sendKeys("input 1");
      expect(mockGeoService.lookup).not.toHaveBeenCalled();
      expect(component.loading).toBe(false);

      await vi.advanceTimersByTimeAsync(2000);
      expect(mockGeoService.lookup).not.toHaveBeenCalled();
      expect(component.loading).toBe(false);

      // change input before debounce --> restarts timeouts
      await inputElement.clear();
      await inputElement.sendKeys("input 2");

      await vi.advanceTimersByTimeAsync(700);
      expect(mockGeoService.lookup).not.toHaveBeenCalled();
      expect(component.loading).toBe(false);
      expect(options).toEqual([]);

      await vi.advanceTimersByTimeAsync(2000);
      expect(mockGeoService.lookup).toHaveBeenCalledWith("input 2");
      expect(mockGeoService.lookup).not.toHaveBeenCalledWith("input 1");
      expect(component.loading).toBe(false);
      expect(options).toEqual([location]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not call lookup service for trivial inputs or same term", async () => {
    vi.useFakeTimers();
    try {
      const inputElement = await loader
        .getHarness(MatInputHarness)
        .then((el) => el.host());

      // empty input
      await expectLookup(" ", false, inputElement);

      // object (as created by autocomplete)
      await expectLookup("[object Object]", false, inputElement);

      // same search term as last lookup
      await expectLookup("search term", true, inputElement);
      mockGeoService.lookup.mockClear();
      await expectLookup("search term", false, inputElement);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should emit new location if value is selected and clear search field", async () => {
    const input = await loader.getHarness(MatInputHarness);
    const selected = { display_name: "selected" } as GeoResult;
    vi.spyOn(component.locationSelected, "emit");

    component["lastUserInput"] = "";

    await component.selectLocation(selected);

    expect(component.locationSelected.emit).toHaveBeenCalledWith({
      location: { geoLookup: selected },
      userInput: "",
    });
    await expect(input.getValue()).resolves.toEqual("");
  });

  it("should handle network errors", async () => {
    vi.useFakeTimers();
    try {
      const error = new HttpErrorResponse({ status: 0 });
      mockGeoService.lookup.mockReturnValue(throwError(() => error));
      const inputElement = await loader.getHarness(MatInputHarness);

      await inputElement.setValue("test");
      await vi.advanceTimersByTimeAsync(3000);

      expect(component.networkError).toBe(true);
      expect(component.otherTypeError).toBe(false);
      expect(component.nothingFound).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should handle service other types errors", async () => {
    vi.useFakeTimers();
    try {
      const error = new HttpErrorResponse({
        status: 504,
      });
      mockGeoService.lookup.mockReturnValue(throwError(() => error));
      const inputElement = await loader.getHarness(MatInputHarness);

      await inputElement.setValue("test");
      await vi.advanceTimersByTimeAsync(3000);

      expect(component.otherTypeError).toBe(true);
      expect(component.networkError).toBe(false);
      expect(component.nothingFound).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  async function expectLookup(
    searchTerm: string,
    lookupCalled: boolean,
    input: TestElement,
  ) {
    await input.clear();
    await input.sendKeys(searchTerm);
    await vi.advanceTimersByTimeAsync(3200);
    if (lookupCalled) {
      expect(mockGeoService.lookup).toHaveBeenCalled();
    } else {
      expect(mockGeoService.lookup).not.toHaveBeenCalled();
    }
  }
});
