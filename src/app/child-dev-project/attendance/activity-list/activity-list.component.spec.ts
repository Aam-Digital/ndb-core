import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ActivityListComponent } from "./activity-list.component";
import { RouterTestingModule } from "@angular/router/testing";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { AttendanceModule } from "../attendance.module";
import { SessionService } from "../../../core/session/session-service/session.service";
import { BackupService } from "../../../core/admin/services/backup.service";
import { Angulartics2Module } from "angulartics2";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { User } from "../../../core/user/user";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";

describe("ActivityListComponent", () => {
  let component: ActivityListComponent;
  let fixture: ComponentFixture<ActivityListComponent>;
  let mockSessionService: jasmine.SpyObj<SessionService>;

  const mockConfig: EntityListConfig = {
    columns: [],
    title: "",
  };

  beforeEach(
    waitForAsync(() => {
      mockSessionService = jasmine.createSpyObj(["getCurrentDBUser"]);
      mockSessionService.getCurrentDBUser.and.returnValue({
        name: "TestUser",
        roles: [],
      });
      TestBed.configureTestingModule({
        imports: [
          AttendanceModule,
          RouterTestingModule,
          Angulartics2Module.forRoot(),
        ],
        providers: [
          {
            provide: EntityMapperService,
            useValue: mockEntityMapper([new User("TestUser")]),
          },
          { provide: SessionService, useValue: mockSessionService },
          { provide: BackupService, useValue: {} },
          {
            provide: ActivatedRoute,
            useValue: {
              data: of(mockConfig),
              queryParams: of({}),
            },
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
