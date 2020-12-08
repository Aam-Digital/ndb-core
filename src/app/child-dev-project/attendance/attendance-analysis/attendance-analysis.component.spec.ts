import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSelectModule } from "@angular/material/select";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AttendanceBlockComponent } from "../attendance-block/attendance-block.component";
import { AttendanceDayBlockComponent } from "../attendance-days/attendance-day-block.component";
import { SchoolBlockComponent } from "../../schools/school-block/school-block.component";
import { AttendanceDaysComponent } from "../attendance-days/attendance-days.component";
import { FormsModule } from "@angular/forms";
import { ChildrenService } from "../../children/children.service";
import { EntityModule } from "../../../core/entity/entity.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { BehaviorSubject } from "rxjs";
import { AttendanceAnalysisComponent } from "./attendance-analysis.component";
import { ChildBlockComponent } from "../../children/child-block-list/child-block/child-block.component";
import { EntityComponentsModule } from "../../../core/entity-components/entity-components.module";
import { RouterTestingModule } from "@angular/router/testing";

describe("AttendanceRegisterComponent", () => {
  let component: AttendanceAnalysisComponent;
  let fixture: ComponentFixture<AttendanceAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AttendanceAnalysisComponent,
        ChildBlockComponent,
        AttendanceBlockComponent,
        AttendanceDayBlockComponent,
        AttendanceDaysComponent,
        SchoolBlockComponent,
      ],
      imports: [
        MatFormFieldModule,
        MatInputModule,
        MatButtonToggleModule,
        MatExpansionModule,
        MatButtonModule,
        MatTableModule,
        MatProgressBarModule,
        MatTooltipModule,
        MatSelectModule,
        MatIconModule,
        MatDatepickerModule,
        MatNativeDateModule,
        FormsModule,
        NoopAnimationsModule,
        EntityComponentsModule,
        EntityModule,
        RouterTestingModule,
      ],
      providers: [
        {
          provide: ChildrenService,
          useValue: {
            getChildren: () => new BehaviorSubject([]),
            getAttendancesOfChild: () => new BehaviorSubject([]),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
