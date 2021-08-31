import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FilterComponent } from "./filter.component";
import { FilterModule } from "../filter.module";

describe("FilterComponent", () => {
  let component: FilterComponent<any>;
  let fixture: ComponentFixture<FilterComponent<any>>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [FilterModule, NoopAnimationsModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should infer available values from data and give sorted filter options", () => {
    component.data = [{ x: "A" }, { y: 123 }, { x: "Z" }];
    component.filterProperty = "x";

    expect(component.filterOptions).toEqual([
      { id: undefined, label: "" },
      { id: "A", label: "A" },
      { id: "Z", label: "Z" },
    ]);
  });

  it("should only include unique values", () => {
    component.data = [{ y: "A" }, { y: "A" }, { y: "Z" }, { y: "Z" }];
    component.filterProperty = "y";

    expect(component.filterOptions).toEqual([
      { id: "A", label: "A" },
      { id: "Z", label: "Z" },
    ]);
  });

  it("should directly use id/label data as options", () => {
    component.data = [
      { key: component.FILTER_VALUE_ALL, label: "All" },
      { key: "A", label: "A" },
      { key: "Z", label: "Z" },
    ];

    expect(component.filterOptions).toEqual([
      // "All" option is removed and added directly in the template with special styling
      { id: "A", label: "A" },
      { id: "Z", label: "Z" },
    ]);
  });
});
