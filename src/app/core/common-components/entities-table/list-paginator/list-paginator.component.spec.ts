import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ListPaginatorComponent } from "./list-paginator.component";
import { MatTableDataSource } from "@angular/material/table";
import { PageEvent } from "@angular/material/paginator";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("ListPaginatorComponent", () => {
  let component: ListPaginatorComponent<any>;
  let fixture: ComponentFixture<ListPaginatorComponent<any>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ListPaginatorComponent, NoopAnimationsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListPaginatorComponent);
    component = fixture.componentInstance;
    component.dataSource = new MatTableDataSource<any>();
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should save pagination settings in the local storage", () => {
    component.idForSavingPagination = "table-id";

    component.onPaginateChange({ pageSize: 20, pageIndex: 1 } as PageEvent);

    expect(
      localStorage.getItem(component.LOCAL_STORAGE_KEY + "table-id"),
    ).toEqual("20");
  });

  it("should update pagination when the idForSavingPagination changed", () => {
    localStorage.setItem(component.LOCAL_STORAGE_KEY + "c1", "11");
    localStorage.setItem(component.LOCAL_STORAGE_KEY + "c2", "12");

    component.idForSavingPagination = "c1";
    component.ngOnChanges({ idForSavingPagination: undefined });
    fixture.detectChanges();

    expect(component.pageSize).toBe(11);
    expect(component.paginator.pageSize).toBe(11);

    component.idForSavingPagination = "c2";
    component.ngOnChanges({ idForSavingPagination: undefined });
    fixture.detectChanges();

    expect(component.pageSize).toBe(12);
    expect(component.paginator.pageSize).toBe(12);
  });
});
