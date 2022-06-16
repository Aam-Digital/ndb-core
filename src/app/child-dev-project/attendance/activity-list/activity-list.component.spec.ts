import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { ActivityListComponent } from "./activity-list.component";
import { ActivatedRoute } from "@angular/router";
import { of, Subject } from "rxjs";
import { AttendanceModule } from "../attendance.module";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { ExportService } from "../../../core/export/export-service/export.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityMapperService } from "app/core/entity/entity-mapper.service";
import { RecurringActivity } from "../model/recurring-activity";

describe("ActivityListComponent", () => {
  let component: ActivityListComponent;
  let fixture: ComponentFixture<ActivityListComponent>;

  const mockConfig: EntityListConfig = {
    columns: [],
    title: "",
  };

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          AttendanceModule,
          MockedTestingModule.withState(),
          FontAwesomeTestingModule,
        ],
        providers: [
          { provide: ExportService, useValue: {} },
          {
            provide: ActivatedRoute,
            useValue: {
              data: of({ config: mockConfig }),
              queryParams: of({}),
              snapshot: { queryParams: {} },
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

  it("should indicate once loading is finished", fakeAsync(() => {
    expect(component.isLoading).toBeTrue();
    const loadTypeSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
    const subject = new Subject<RecurringActivity[]>();
    loadTypeSpy.and.returnValue(subject.toPromise());
    component.ngOnInit();
    subject.complete();
    tick();
    expect(component.isLoading).toBeFalse();
  }));
});
