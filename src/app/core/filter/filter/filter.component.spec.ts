import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FilterComponent } from "./filter.component";
import { Note } from "../../../child-dev-project/notes/model/note";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { HarnessLoader } from "@angular/cdk/testing";
import { MatSelectHarness } from "@angular/material/select/testing";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { Child } from "../../../child-dev-project/children/model/child";
import { BooleanFilterConfig } from "../../entity-list/EntityListConfig";

describe("FilterComponent", () => {
  let component: FilterComponent;
  let fixture: ComponentFixture<FilterComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set up category filter from configurable enum", async () => {
    component.entityType = Note;
    const t1 = defaultInteractionTypes[1];
    const n1 = new Note();
    n1.category = t1;
    const n2 = new Note();
    n2.category = defaultInteractionTypes[2];
    component.entities = [n1, n2];
    component.onlyShowRelevantFilterOptions = true;
    component.filterConfig = [{ id: "category" }];

    await component.ngOnChanges({ filterConfig: true } as any);

    const selection = await loader.getHarness(MatSelectHarness);
    await selection.open();
    const options = await selection.getOptions();
    expect(options).toHaveSize(3);

    const selectedOption = await options[1].getText();
    expect(selectedOption).toEqual(t1.label);

    await options[1].click();
    const selected = await selection.getValueText();
    expect(selected).toEqual(t1.label);
    expect(component.filterObj).toEqual({ "category.id": t1.id } as any);
  });

  it("should support a boolean filter", async () => {
    const child1 = new Child("dropoutId");
    child1.status = "Dropout";
    const child2 = new Child("activeId");
    component.entities = [child1, child2];
    component.entityType = Child;
    component.filterConfig = [
      {
        id: "isActive",
        type: "boolean",
        default: "true",
        true: "Currently active children",
        false: "Currently inactive children",
        all: "All children",
      } as BooleanFilterConfig,
    ];

    await component.ngOnChanges({ filterConfig: true } as any);

    const selection = await loader.getHarness(MatSelectHarness);
    let selected = await selection.getValueText();
    expect(selected).toBe("Currently active children");
    expect(component.filterObj).toEqual({ isActive: true } as any);

    await selection.open();
    const options = await selection.getOptions();
    const falseOption = options[2];
    const label = await falseOption.getText();
    expect(label).toBe("Currently inactive children");

    await falseOption.click();
    selected = await selection.getValueText();
    expect(selected).toBe("Currently inactive children");
    expect(component.filterObj).toEqual({ isActive: false } as any);
  });
});
