import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FilterComponent } from "./filter.component";
import { Note } from "../../../child-dev-project/notes/model/note";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ActivatedRoute } from "@angular/router";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { StringFilter } from "../filters/stringFilter";

class ActivatedRouteMock {
  public snapshot = {
    queryParams: {},
  };
}

describe("FilterComponent", () => {
  let component: FilterComponent;
  let fixture: ComponentFixture<FilterComponent>;

  let activatedRouteMock = new ActivatedRouteMock();

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
    fixture = TestBed.createComponent(FilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  async function setComponentInputs(
    inputs: Partial<{
      entityType: any;
      useUrlQueryParams: boolean;
      filterConfig: any[];
      entities: any[];
      onlyShowRelevantFilterOptions: boolean;
      filterObj: any;
    }>,
  ) {
    if (inputs.entityType !== undefined) {
      fixture.componentRef.setInput("entityType", inputs.entityType);
    }
    if (inputs.useUrlQueryParams !== undefined) {
      fixture.componentRef.setInput(
        "useUrlQueryParams",
        inputs.useUrlQueryParams,
      );
    }
    if (inputs.filterConfig !== undefined) {
      fixture.componentRef.setInput("filterConfig", inputs.filterConfig);
    }
    if (inputs.entities !== undefined) {
      fixture.componentRef.setInput("entities", inputs.entities);
    }
    if (inputs.onlyShowRelevantFilterOptions !== undefined) {
      fixture.componentRef.setInput(
        "onlyShowRelevantFilterOptions",
        inputs.onlyShowRelevantFilterOptions,
      );
    }
    if (inputs.filterObj !== undefined) {
      fixture.componentRef.setInput("filterObj", inputs.filterObj);
    }

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it("should have no filter selected when url params are empty", async () => {
    await setComponentInputs({
      entityType: Note,
      useUrlQueryParams: true,
      filterConfig: [{ id: "category" }],
    });

    expect(component.filterSelections().length).toBe(1);
    expect(component.filterSelections()[0].name).toBe("category");
    expect(component.filterSelections()[0].selectedOptionValues).toHaveLength(
      0,
    );
  });

  it("should load url params and set single filter value", async () => {
    activatedRouteMock.snapshot = {
      queryParams: {
        category: "foo",
      },
    };

    await setComponentInputs({
      entityType: Note,
      useUrlQueryParams: true,
      filterConfig: [{ id: "category" }],
    });

    expect(component.filterSelections().length).toBe(1);
    expect(component.filterSelections()[0].name).toBe("category");
    expect(component.filterSelections()[0].selectedOptionValues.length).toBe(1);
    expect(component.filterSelections()[0].selectedOptionValues[0]).toBe("foo");
  });

  it("should load url params and set multiple filter value", async () => {
    activatedRouteMock.snapshot = {
      queryParams: {
        category: "foo,bar",
      },
    };

    await setComponentInputs({
      entityType: Note,
      useUrlQueryParams: true,
      filterConfig: [{ id: "category" }],
    });

    expect(component.filterSelections().length).toBe(1);
    expect(component.filterSelections()[0].name).toBe("category");
    expect(component.filterSelections()[0].selectedOptionValues.length).toBe(2);
    expect(component.filterSelections()[0].selectedOptionValues[0]).toBe("foo");
    expect(component.filterSelections()[0].selectedOptionValues[1]).toBe("bar");
  });

  it("should parse url params for option values that contain commas", async () => {
    // Option values may themselves contain a comma. Selected values are
    // joined by "," in the url, so each value is encoded with
    // encodeURIComponent before being joined - a "," inside a value is thus
    // escaped and not mistaken for the multi-value separator.
    // (using a non-schema property so a SelectableFilter with options is generated)
    const e1 = new TestEntity();
    e1["customStatus"] = "A";
    const e2 = new TestEntity();
    e2["customStatus"] = "A,B";
    const e3 = new TestEntity();
    e3["customStatus"] = "B,C";

    activatedRouteMock.snapshot = {
      queryParams: {
        customStatus: ["A", "B,C"].map(encodeURIComponent).join(","),
      },
    };

    await setComponentInputs({
      entityType: TestEntity,
      entities: [e1, e2, e3],
      useUrlQueryParams: true,
      filterConfig: [{ id: "customStatus" }],
    });

    const customStatusFilter = component
      .filterSelections()
      .find((f) => f.name === "customStatus");
    expect(customStatusFilter.selectedOptionValues).toEqual(["A", "B,C"]);
  });

  it("should encode filter values containing commas before storing them in the url", () => {
    const tableStateUrl = (component as any).tableStateUrl;
    const updateFilterParamSpy = vi.spyOn(tableStateUrl, "updateFilterParam");
    fixture.componentRef.setInput("useUrlQueryParams", true);
    fixture.detectChanges();

    const filter = new StringFilter("other", "Other");
    component.filterOptionSelected(filter, ["Doe, John"]);

    expect(updateFilterParamSpy).toHaveBeenCalledWith(
      "other",
      encodeURIComponent("Doe, John"),
      false,
    );
  });

  it("should load url params and set no filter value when empty", async () => {
    activatedRouteMock.snapshot = {
      queryParams: {
        category: "",
      },
    };

    await setComponentInputs({
      entityType: Note,
      useUrlQueryParams: true,
      filterConfig: [{ id: "category" }],
    });

    expect(component.filterSelections().length).toBe(1);
    expect(component.filterSelections()[0].name).toBe("category");
    expect(component.filterSelections()[0].selectedOptionValues).toHaveLength(
      0,
    );
  });

  it("should apply url param filter even when field is not in filterConfig", async () => {
    const e1 = TestEntity.create({ other: "Alipore" });
    const e2 = TestEntity.create({ other: "Delhi" });
    let emittedFilterObj: any;
    component.filterObjChange.subscribe(
      (filterObj) => (emittedFilterObj = filterObj),
    );

    activatedRouteMock.snapshot = {
      queryParams: { other: "Alipore" },
    };

    await setComponentInputs({
      entityType: TestEntity,
      entities: [e1, e2],
      useUrlQueryParams: true,
      filterConfig: [],
      filterObj: {},
    });

    // "other" is a string field, so a StringFilter with a $regex query is applied
    // a single condition needs no $and wrapper
    expect(emittedFilterObj).toEqual({
      other: { $regex: "Alipore", $options: "i" },
    } as any);
  });

  it("should clear default filters when other URL params are present", async () => {
    activatedRouteMock.snapshot = {
      queryParams: { category: "someCategory" },
    };

    await setComponentInputs({
      entityType: Note,
      useUrlQueryParams: true,
      filterConfig: [{ id: "date", default: "0" }, { id: "category" }],
    });

    const dateFilter = component
      .filterSelections()
      .find((f) => f.name === "date");
    expect(dateFilter.selectedOptionValues).toHaveLength(0);

    const categoryFilter = component
      .filterSelections()
      .find((f) => f.name === "category");
    expect(categoryFilter.selectedOptionValues).toEqual(["someCategory"]);
  });

  it("should keep other filters' defaults when the user selects a filter option", async () => {
    await setComponentInputs({
      entityType: Note,
      useUrlQueryParams: true,
      filterConfig: [{ id: "date", default: "0" }, { id: "category" }],
    });

    const categoryFilter = component
      .filterSelections()
      .find((f) => f.name === "category");
    // In the real app, selecting an option writes it to the URL (async router
    // navigation) and the dropdown closing then fires another change event,
    // which used to read the URL back and clear all other filters.
    // The mocked ActivatedRoute is static and never reflects the component's
    // own navigation, so both steps are simulated manually here:
    component.filterOptionSelected(categoryFilter, ["someCategory"]);

    // 1. the router has now written the selection to the URL
    activatedRouteMock.snapshot = {
      queryParams: { category: "someCategory" },
    };
    // 2. the follow-up change event from the closing dropdown
    component.filterOptionSelected(categoryFilter, ["someCategory"]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const dateFilter = component
      .filterSelections()
      .find((f) => f.name === "date");
    expect(dateFilter.selectedOptionValues).toEqual(["0"]);
  });

  it("should compute available category options and build filterObj", async () => {
    const t1 = defaultInteractionTypes[0];
    const t2 = defaultInteractionTypes[1];
    let emittedFilterObj: any;
    component.filterObjChange.subscribe(
      (filterObj) => (emittedFilterObj = filterObj),
    );

    const n1 = new Note();
    n1.category = t1;
    const n2 = new Note();
    n2.category = t2;

    await setComponentInputs({
      entityType: Note,
      entities: [n1, n2],
      onlyShowRelevantFilterOptions: true,
      filterConfig: [{ id: "category" }],
      filterObj: {},
    });

    const avilableOptions = component
      .filterSelections()
      .find((f) => f.name === "category");
    expect(avilableOptions).toBeTruthy();
    expect((avilableOptions as any).options.length).toBe(2);

    component.filterOptionSelected(avilableOptions, [t1.id]);

    // a single condition needs no $and wrapper
    expect(emittedFilterObj).toEqual({ "category.id": t1.id } as any);

    component.filterOptionSelected(avilableOptions, [t1.id, t2.id]);

    expect(emittedFilterObj).toEqual({
      $or: [{ "category.id": t1.id }, { "category.id": t2.id }],
    } as any);
  });
});
