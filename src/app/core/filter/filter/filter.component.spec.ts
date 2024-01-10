import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FilterComponent } from "./filter.component";
import { Note } from "../../../child-dev-project/notes/model/note";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { HarnessLoader } from "@angular/cdk/testing";
import { MatSelectHarness } from "@angular/material/select/testing";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

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
    const t1 = defaultInteractionTypes[0];
    const n1 = new Note();
    n1.category = t1;
    const n2 = new Note();
    n2.category = defaultInteractionTypes[1];
    component.entities = [n1, n2];
    component.onlyShowRelevantFilterOptions = true;
    component.filterConfig = [{ id: "category" }];

    await component.ngOnChanges({ filterConfig: true } as any);

    const selection = await loader.getHarness(MatSelectHarness);
    await selection.open();
    const options = await selection.getOptions();
    expect(options).toHaveSize(2);

    const selectedOption = await options[0].getText();
    expect(selectedOption).toEqual(t1.label);

    await options[0].click();
    const selected = await selection.getValueText();
    expect(selected).toEqual(t1.label);
    expect(component.filterObj).toEqual({
      $and: [
        {
          $or: [{ "category.id": t1.id }],
        },
      ],
    } as any);
  });
});
