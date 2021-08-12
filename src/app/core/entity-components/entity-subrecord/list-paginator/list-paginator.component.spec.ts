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
import { SessionService } from "../../../session/session-service/session.service";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { MatTableDataSource } from "@angular/material/table";
import { User } from "../../../user/user";
import { PageEvent } from "@angular/material/paginator";

describe("ListPaginatorComponent", () => {
  let component: ListPaginatorComponent<any>;
  let fixture: ComponentFixture<ListPaginatorComponent<any>>;

  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockSessionService: jasmine.SpyObj<SessionService>;

  beforeEach(
    waitForAsync(() => {
      mockEntityMapper = jasmine.createSpyObj(["save", "load"]);
      mockEntityMapper.load.and.resolveTo(new User());
      mockSessionService = jasmine.createSpyObj(["getCurrentDBUser"]);
      mockSessionService.getCurrentDBUser.and.returnValue({
        name: "TestUser",
        roles: [],
      });

      TestBed.configureTestingModule({
        imports: [EntityListModule, NoopAnimationsModule],
        providers: [
          { provide: SessionService, useValue: mockSessionService },
          { provide: EntityMapperService, useValue: mockEntityMapper },
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

    component.onPaginateChange({ pageSize: 20, pageIndex: 1 } as PageEvent);
    tick();

    expect(mockEntityMapper.save).toHaveBeenCalledWith(component.user);
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
});
