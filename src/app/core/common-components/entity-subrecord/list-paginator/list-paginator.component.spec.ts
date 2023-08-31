import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { ListPaginatorComponent } from "./list-paginator.component";
import { MatTableDataSource } from "@angular/material/table";
import { PageEvent } from "@angular/material/paginator";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { User } from "../../../user/user";

describe("ListPaginatorComponent", () => {
  let component: ListPaginatorComponent<any>;
  let fixture: ComponentFixture<ListPaginatorComponent<any>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ListPaginatorComponent, MockedTestingModule.withState()],
    }).compileComponents();
  }));

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
  }));

  it("should update pagination when the idForSavingPagination changed", fakeAsync(() => {
    const userPaginationSettings = {
      c1: 11,
      c2: 12,
    };
    component.user = {
      paginatorSettingsPageSize: userPaginationSettings,
    } as Partial<User> as User;

    component.idForSavingPagination = "c1";
    component.ngOnChanges({ idForSavingPagination: undefined });
    tick();
    fixture.detectChanges();

    expect(component.pageSize).toBe(userPaginationSettings.c1);
    expect(component.paginator.pageSize).toBe(userPaginationSettings.c1);

    component.idForSavingPagination = "c2";
    component.ngOnChanges({ idForSavingPagination: undefined });
    tick();
    fixture.detectChanges();

    expect(component.pageSize).toBe(userPaginationSettings.c2);
    expect(component.paginator.pageSize).toBe(userPaginationSettings.c2);
  }));
});
