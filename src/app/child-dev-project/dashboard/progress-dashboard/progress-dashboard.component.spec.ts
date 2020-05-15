import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ProgressDashboardComponent } from "./progress-dashboard.component";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { MockDatabase } from "../../../core/database/mock-database";
import { Database } from "../../../core/database/database";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { AlertService } from "../../../core/alerts/alert.service";

describe("ProgressDashboardComponent", () => {
  let component: ProgressDashboardComponent;
  let fixture: ComponentFixture<ProgressDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProgressDashboardComponent],
      imports: [
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatProgressBarModule,
        CommonModule,
        FormsModule,
      ],
      providers: [
        { provide: Database, useClass: MockDatabase },
        {
          provide: AlertService,
          useValue: jasmine.createSpyObj(["addDebug", "addInfo", "addWarning"]),
        },
        EntityMapperService,
        EntitySchemaService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
