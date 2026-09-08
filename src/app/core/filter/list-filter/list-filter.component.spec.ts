import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ListFilterComponent } from "./list-filter.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { SelectableFilter } from "../filters/filters";

describe("ListFilterComponent", () => {
  let component: ListFilterComponent<any>;
  let fixture: ComponentFixture<ListFilterComponent<any>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ListFilterComponent, MockedTestingModule.withState()],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListFilterComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      "filterConfig",
      new SelectableFilter<any>("test", []),
    );
    fixture.detectChanges();
  });

  it("should emit an empty selection when the autocomplete resets its value to undefined", () => {
    // basic-autocomplete emits undefined when a cleared single-select dropdown is closed
    const emittedValues: string[][] = [];
    component
      .filterConfig()
      .selectedOptionChange.subscribe((values) => emittedValues.push(values));

    component.autocompleteControl.setValue(undefined);

    expect(emittedValues).toEqual([[]]);
  });
});
