import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ListFilterComponent } from "./list-filter.component";
import { FilterSelection } from "../../../filter/filter-selection/filter-selection";

describe("ListFilterComponent", () => {
  let component: ListFilterComponent<any>;
  let fixture: ComponentFixture<ListFilterComponent<any>>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ListFilterComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ListFilterComponent);
    component = fixture.componentInstance;
    component.filterConfig = new FilterSelection<any>("test", []);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
