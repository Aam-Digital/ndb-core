import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ListPaginatorComponent } from "./list-paginator.component";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginatorIntl, PageEvent } from "@angular/material/paginator";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { PaginatedDataSource } from "../data-source/paginated-data-source";
import { UnknownTotalPaginatorIntl } from "./unknown-total-paginator-intl";

describe("ListPaginatorComponent", () => {
  let component: ListPaginatorComponent<any>;
  let fixture: ComponentFixture<ListPaginatorComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListPaginatorComponent, MockedTestingModule.withState()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListPaginatorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("dataSource", new MatTableDataSource<any>());
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it("should save pagination settings in the local storage", () => {
    fixture.componentRef.setInput("idForSavingPagination", "table-id");
    fixture.detectChanges();

    component.onPaginateChange({ pageSize: 20, pageIndex: 1 } as PageEvent);

    expect(
      localStorage.getItem(component.LOCAL_STORAGE_KEY + "table-id"),
    ).toEqual("20");
  });

  it("should update pagination when the idForSavingPagination changed", () => {
    localStorage.setItem(component.LOCAL_STORAGE_KEY + "c1", "11");
    localStorage.setItem(component.LOCAL_STORAGE_KEY + "c2", "12");

    fixture.componentRef.setInput("idForSavingPagination", "c1");
    fixture.detectChanges();

    expect(component.pageSize()).toBe(11);
    expect(component.paginator.pageSize).toBe(11);

    fixture.componentRef.setInput("idForSavingPagination", "c2");
    fixture.detectChanges();

    expect(component.pageSize()).toBe(12);
    expect(component.paginator.pageSize).toBe(12);
  });

  it("should bind paginator to a replaced dataSource instance", () => {
    const newDataSource = new MatTableDataSource<any>();

    fixture.componentRef.setInput("dataSource", newDataSource);
    fixture.detectChanges();

    expect(newDataSource.paginator).toBe(component.paginator);
  });

  it("should mark the paginator total as unknown for a PaginatedDataSource with more records", () => {
    const intl = fixture.debugElement.injector.get(
      MatPaginatorIntl,
    ) as UnknownTotalPaginatorIntl;
    expect(intl).toBeInstanceOf(UnknownTotalPaginatorIntl);
    // a plain MatTableDataSource always has a known total
    expect(intl.hasUnknownTotalCount).toBe(false);

    const paginated = TestBed.runInInjectionContext(
      () => new PaginatedDataSource(),
    );
    paginated.hasUnknownTotalCount.set(true);
    fixture.componentRef.setInput("dataSource", paginated);
    fixture.detectChanges();

    expect(intl.hasUnknownTotalCount).toBe(true);

    // when the total becomes known again, the flag is reset
    paginated.hasUnknownTotalCount.set(false);
    fixture.detectChanges();
    expect(intl.hasUnknownTotalCount).toBe(false);
  });
});
