import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ListFilterComponent } from "./list-filter.component";
import { SelectableFilter } from "../filter-selection/filter-selection";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

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
    component.filterConfig = new SelectableFilter<any>("test", []);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
