import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ListPaginatorComponent } from "./list-paginator.component";
import { EntityListModule } from "../entity-list.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { SessionService } from "../../../session/session-service/session.service";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { MatTableDataSource } from "@angular/material/table";

describe("ListPaginatorComponent", () => {
  let component: ListPaginatorComponent<any>;
  let fixture: ComponentFixture<ListPaginatorComponent<any>>;

  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockSessionService: jasmine.SpyObj<SessionService>;

  beforeEach(
    waitForAsync(() => {
      mockEntityMapper = jasmine.createSpyObj(["save"]);
      mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);

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
});
