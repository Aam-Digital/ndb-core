import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ActivityListComponent } from "./activity-list.component";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { AttendanceModule } from "../attendance.module";
import { Angulartics2Module } from "angulartics2";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { ExportService } from "../../../core/export/export-service/export.service";
import { MockSessionModule } from "../../../core/session/mock-session.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import {
  ENTITIES,
  entityRegistry,
} from "../../../core/entity/database-entity.decorator";

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
          RouterTestingModule,
          Angulartics2Module.forRoot(),
          MockSessionModule.withState(),
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
          { provide: ENTITIES, useValue: entityRegistry },
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
