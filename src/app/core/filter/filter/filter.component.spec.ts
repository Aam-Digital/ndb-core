import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FilterComponent } from "./filter.component";
import { Note } from "../../../child-dev-project/notes/model/note";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { HarnessLoader } from "@angular/cdk/testing";
import { MatSelectHarness } from "@angular/material/select/testing";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ActivatedRoute, Router } from "@angular/router";
import { BasicFilterConfig } from "../../entity-list/EntityListConfig";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

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
    const initialQueryParams = { dateOfBirth: "a,b" };
    activatedRouteMock.snapshot.queryParams = initialQueryParams;
    const routerNavigate = spyOn(router, "navigate");

    component.entityType = TestEntity;
    component.entities = [];
    component.useUrlQueryParams = true;
    component.filterConfig = [{ id: "category" } as BasicFilterConfig];
    await component.ngOnChanges({ filterConfig: true } as any);

    component.filterOptionSelected(component.filterSelections[0], [
      "categoryXX",
      "categoryYY",
    ]);
    // filter options should be added to url
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: activatedRouteMock as any,
      queryParams: { ...initialQueryParams, category: "categoryXX,categoryYY" },
      queryParamsHandling: "merge",
    });
    routerNavigate.calls.reset();

    const longOptions = Array(250).fill("categoryZZ");
    component.filterOptionSelected(component.filterSelections[0], longOptions);
    // long options should be skipped, short options for other filter still present
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: activatedRouteMock as any,
      queryParams: { ...initialQueryParams, category: undefined },
      queryParamsHandling: "merge",
    });
    routerNavigate.calls.reset();
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
