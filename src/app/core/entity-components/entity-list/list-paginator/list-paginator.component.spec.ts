import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ListPaginatorComponent } from "./list-paginator.component";
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
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
