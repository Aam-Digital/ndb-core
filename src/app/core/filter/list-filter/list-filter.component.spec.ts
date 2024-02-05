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
    component.filterConfig = new SelectableFilter<any>("test", []);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
