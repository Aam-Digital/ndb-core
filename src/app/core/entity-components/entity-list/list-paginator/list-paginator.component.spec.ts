import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { ListPaginatorComponent } from "./list-paginator.component";
import { EntityListModule } from "../entity-list.module";
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
      mockEntityMapper = jasmine.createSpyObj(["save"]);
      mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
      mockSessionService.getCurrentUser.and.returnValue(new User());

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

  it("should disable the all toggle when too little entries are available", () => {
    component.dataSource.data = new Array(2);

    component.ngOnChanges({ dataSource: null });

    expect(component.allToggleDisabled).toBeTrue();
  });

  it("should reset the pagination size when clicking the all toggle twice", () => {
    component.paginatorPageSize = 20;
    component.dataSource.data = new Array(100);
    component.showingAll = false;
    component.ngOnChanges({ dataSource: null });

    component.changeAllToggle();

    expect(component.paginatorPageSize).toBe(100);
    expect(component.showingAll).toBeTrue();

    component.changeAllToggle();

    expect(component.paginatorPageSize).toBe(20);
    expect(component.showingAll).toBeFalse();
  });

  it("should toggle back to second biggest size if the previous size is too big", fakeAsync(() => {
    component.dataSource.data = new Array(100);
    component.paginator._changePageSize(100);
    component.paginatorPageSizeBeforeToggle = 200;

    component.ngOnChanges({ dataSource: null });

    expect(component.showingAll).toBeTrue();
    expect(component.paginatorPageSize).toBe(100);

    component.changeAllToggle();

    const po = component.paginatorPageSizeOptions;
    expect(component.paginatorPageSize).toBe(po[po.length - 2]);
  }));
});
