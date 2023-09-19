import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FilterComponent } from "./filter.component";
import { Note } from "../../../child-dev-project/notes/model/note";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { HarnessLoader } from "@angular/cdk/testing";
import { MatSelectHarness } from "@angular/material/select/testing";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { BooleanFilterConfig } from "../../entity-list/EntityListConfig";
import { Entity } from "../../entity/model/entity";
import { FilterService } from "../filter.service";

describe("FilterComponent", () => {
  let component: FilterComponent;
  let fixture: ComponentFixture<FilterComponent>;
  let loader: HarnessLoader;
  let filterService: FilterService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();

    filterService = TestBed.inject(FilterService);
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
    class EntityWithBooleanFlag extends Entity {
      value: boolean;

      static create(value: boolean) {
        const e = new EntityWithBooleanFlag();
        e.value = value;
        return e;
      }
    }

    const recordFalse = EntityWithBooleanFlag.create(false);
    const recordTrue = EntityWithBooleanFlag.create(true);
    const recordUndefined = new EntityWithBooleanFlag();
    component.entities = [recordFalse, recordTrue, recordUndefined];
    component.entityType = EntityWithBooleanFlag;
    component.filterConfig = [
      {
        id: "value",
        type: "boolean",
        default: "true",
        true: "is true",
        false: "is not true",
        all: "All",
      } as BooleanFilterConfig,
    ];

    await component.ngOnChanges({ filterConfig: true } as any);

    const selection = await loader.getHarness(MatSelectHarness);
    let selected = await selection.getValueText();
    expect(selected).toBe("is true");
    testFilter(component.filterObj, component.entities, [recordTrue]);

    await selection.open();
    const options = await selection.getOptions();
    const falseOption = options[2];
    const label = await falseOption.getText();
    expect(label).toBe("is not true");

    await falseOption.click();
    selected = await selection.getValueText();
    expect(selected).toBe("is not true");
    testFilter(component.filterObj, component.entities, [
      recordFalse,
      recordUndefined,
    ]);
  });

  function testFilter(filterObj, entities, expectedFilteredResult) {
    const filterPred = filterService.getFilterPredicate(filterObj);
    const filtered = entities.filter(filterPred);
    expect(filtered).toEqual(expectedFilteredResult);
  }
});
