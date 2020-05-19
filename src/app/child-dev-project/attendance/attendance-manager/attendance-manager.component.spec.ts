import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { AttendanceManagerComponent } from "./attendance-manager.component";
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
import { ChildBlockComponent } from "../../children/child-block/child-block.component";
import { AttendanceBlockComponent } from "../attendance-block/attendance-block.component";
import { AttendanceDayBlockComponent } from "../attendance-days/attendance-day-block.component";
import { SchoolBlockComponent } from "../../schools/school-block/school-block.component";
import { AttendanceDaysComponent } from "../attendance-days/attendance-days.component";
import { FormsModule } from "@angular/forms";
import { EntitySubrecordModule } from "../../../core/entity-subrecord/entity-subrecord.module";
import { ChildrenService } from "../../children/children.service";
import { EntityModule } from "../../../core/entity/entity.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { BehaviorSubject } from "rxjs";

describe("AttendanceManagerComponent", () => {
  let component: AttendanceManagerComponent;
  let fixture: ComponentFixture<AttendanceManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AttendanceManagerComponent,
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
        EntitySubrecordModule,
        EntityModule,
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
    fixture = TestBed.createComponent(AttendanceManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
