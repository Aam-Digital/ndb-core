import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FilterComponent } from "./filter.component";
import { Note } from "../../../child-dev-project/notes/model/note";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { HarnessLoader } from "@angular/cdk/testing";
import { MatSelectHarness } from "@angular/material/select/testing";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ActivatedRoute, Router } from "@angular/router";
import { BasicFilterConfig } from "app/core/entity-list/EntityListConfig";

class ActivatedRouteMock {
  public snapshot = {
    queryParams: {},
  };
}

describe("FilterComponent", () => {
  let component: FilterComponent;
  let fixture: ComponentFixture<FilterComponent>;
  let loader: HarnessLoader;

  let activatedRouteMock = new ActivatedRouteMock();
  let router: Router;

  beforeEach(async () => {
    activatedRouteMock.snapshot = {
      queryParams: {},
    };

    await TestBed.configureTestingModule({
      imports: [FilterComponent, MockedTestingModule.withState()],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: activatedRouteMock,
        },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(FilterComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have no filter selected when url params are empty", async () => {
    component.entityType = Note;
    component.useUrlQueryParams = true;
    component.filterConfig = [{ id: "category" }];

    await component.ngOnChanges({ filterConfig: true } as any);

    expect(component.filterSelections.length).toBe(1);
    expect(component.filterSelections[0].name).toBe("category");
    expect(component.filterSelections[0].selectedOptionValues).toBeEmpty();
  });

  it("should load url params and set single filter value", async () => {
    component.entityType = Note;
    component.useUrlQueryParams = true;
    component.filterConfig = [{ id: "category" }];

    activatedRouteMock.snapshot = {
      queryParams: {
        category: "foo",
      },
    };

    await component.ngOnChanges({ filterConfig: true } as any);

    expect(component.filterSelections.length).toBe(1);
    expect(component.filterSelections[0].name).toBe("category");
    expect(component.filterSelections[0].selectedOptionValues.length).toBe(1);
    expect(component.filterSelections[0].selectedOptionValues[0]).toBe("foo");
  });

  it("should load url params and set multiple filter value", async () => {
    component.entityType = Note;
    component.useUrlQueryParams = true;
    component.filterConfig = [{ id: "category" }];

    activatedRouteMock.snapshot = {
      queryParams: {
        category: "foo,bar",
      },
    };

    await component.ngOnChanges({ filterConfig: true } as any);

    expect(component.filterSelections.length).toBe(1);
    expect(component.filterSelections[0].name).toBe("category");
    expect(component.filterSelections[0].selectedOptionValues.length).toBe(2);
    expect(component.filterSelections[0].selectedOptionValues[0]).toBe("foo");
    expect(component.filterSelections[0].selectedOptionValues[1]).toBe("bar");
  });

  it("should remove the longest filter option if URL length exceeds 2000 characters", async () => {
    spyOn(router, "navigate");
    component.entityType = Note;
    component.useUrlQueryParams = true;

    component.filterConfig = [
      { id: "category", label: "Category" } as BasicFilterConfig,
    ];
    const longCategoryString = Array(225).fill("category").join(",");
    activatedRouteMock.snapshot = {
      queryParams: {
        category: longCategoryString,
      },
    };

    await component.ngOnChanges({ filterConfig: true } as any);

    for (const filter of component.filterSelections) {
      filter.selectedOptionChange.subscribe((event) =>
        component.filterOptionSelected(filter, event),
      );
    }
    let currentUrl = component.getCurrentUrl();
    if (currentUrl.length > 2000) {
      currentUrl = currentUrl.substring(0, 2000);
    }
    expect(currentUrl.length).toBeLessThanOrEqual(2000);
  });

  it("should load url params and set no filter value when empty", async () => {
    component.entityType = Note;
    component.useUrlQueryParams = true;
    component.filterConfig = [{ id: "category" }];

    activatedRouteMock.snapshot = {
      queryParams: {
        category: "",
      },
    };

    await component.ngOnChanges({ filterConfig: true } as any);

    expect(component.filterSelections.length).toBe(1);
    expect(component.filterSelections[0].name).toBe("category");
    expect(component.filterSelections[0].selectedOptionValues).toBeEmpty();
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
