import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ListPaginatorComponent } from "./list-paginator.component";
import { FilterSelection } from "../../../filter/filter-selection/filter-selection";
import { EntityListModule } from "../entity-list.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("ListFilterComponent", () => {
  let component: ListPaginatorComponent<any>;
  let fixture: ComponentFixture<ListPaginatorComponent<any>>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [EntityListModule, NoopAnimationsModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ListPaginatorComponent);
    component = fixture.componentInstance;
   //  component.filterConfig = new FilterSelection<any>("test", []);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
