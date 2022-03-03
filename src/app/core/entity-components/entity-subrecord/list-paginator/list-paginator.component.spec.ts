import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { ListPaginatorComponent } from "./list-paginator.component";
import { EntityListModule } from "../../entity-list/entity-list.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatTableDataSource } from "@angular/material/table";
import { PageEvent } from "@angular/material/paginator";
import { MockSessionModule } from "../../../session/mock-session.module";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { User } from "../../../user/user";

describe("ListPaginatorComponent", () => {
  let component: ListPaginatorComponent<any>;
  let fixture: ComponentFixture<ListPaginatorComponent<any>>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          EntityListModule,
          NoopAnimationsModule,
          MockSessionModule.withState(),
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ListPaginatorComponent);
    component = fixture.componentInstance;
    component.dataSource = new MatTableDataSource<any>();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should save pagination settings in the user entity", fakeAsync(() => {
    component.idForSavingPagination = "table-id";
    const saveEntitySpy = spyOn(TestBed.inject(EntityMapperService), "save");

    component.onPaginateChange({ pageSize: 20, pageIndex: 1 } as PageEvent);
    tick();

    expect(saveEntitySpy).toHaveBeenCalledWith(component.user);
    expect(component.user.paginatorSettingsPageSize["table-id"]).toEqual(20);
    expect(component.user.paginatorSettingsPageIndex["table-id"]).toEqual(1);
  }));

  it("should reset the pagination size when clicking the all toggle twice", () => {
    component.pageSize = 20;
    component.dataSource.data = new Array(100);
    component.showingAll = false;
    component.ngOnChanges({ dataSource: null });

    component.changeAllToggle();

    expect(component.pageSize).toBe(100);
    expect(component.showingAll).toBeTrue();

    component.changeAllToggle();

    expect(component.pageSize).toBe(20);
    expect(component.showingAll).toBeFalse();
  });

  it("should update pagination when the idForSavingPagination changed", fakeAsync(() => {
    const userPaginationSettings = {
      c1: 11,
      c2: 12,
    };
    component.user = ({
      paginatorSettingsPageSize: userPaginationSettings,
      paginatorSettingsPageIndex: {},
    } as Partial<User>) as User;

    component.idForSavingPagination = "c1";
    component.ngOnChanges({ idForSavingPagination: undefined });
    tick();
    expect(component.pageSize).toBe(userPaginationSettings.c1);
    expect(component.paginator.pageSize).toBe(userPaginationSettings.c1);

    component.idForSavingPagination = "c2";
    component.ngOnChanges({ idForSavingPagination: undefined });
    tick();
    expect(component.pageSize).toBe(userPaginationSettings.c2);
    expect(component.paginator.pageSize).toBe(userPaginationSettings.c2);
  }));
});
