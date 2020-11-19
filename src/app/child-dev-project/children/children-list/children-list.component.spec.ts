import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ChildrenListComponent } from "./children-list.component";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CommonModule } from "@angular/common";
import { ChildrenService } from "../children.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { MockDatabase } from "../../../core/database/mock-database";
import { Database } from "../../../core/database/database";
import { RouterTestingModule } from "@angular/router/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { AttendanceBlockComponent } from "../../attendance/attendance-block/attendance-block.component";
import { FormsModule } from "@angular/forms";
import { ChildBlockComponent } from "../child-block/child-block.component";
import { SchoolBlockComponent } from "../../schools/school-block/school-block.component";
import { FilterPipeModule } from "ngx-filter-pipe";
import { AttendanceDaysComponent } from "../../attendance/attendance-days/attendance-days.component";
import { EntitySubrecordModule } from "../../../core/entity-subrecord/entity-subrecord.module";
import { AttendanceDayBlockComponent } from "../../attendance/attendance-days/attendance-day-block.component";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { ExportDataComponent } from "../../../core/admin/export-data/export-data.component";
import { ChildPhotoService } from "../child-photo-service/child-photo.service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { MatPaginatorModule } from "@angular/material/paginator";
import { User } from "app/core/user/user";
import { of } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";

describe("ChildrenListComponent", () => {
  let component: ChildrenListComponent;
  let fixture: ComponentFixture<ChildrenListComponent>;
  const routeMock = {
    data: of({
      title: "Children List",
      columns: [
        { type: "text", title: "PN", id: "projectNumber" },
        { type: "child-block", title: "Name", id: "name" },
        { type: "text", title: "Age", id: "age" },
        { type: "date", title: "DoB", id: "dateOfBirth" },
        { type: "text", title: "Gender", id: "gender" },
        { type: "list-class", title: "Class", id: "schoolClass" },
        { type: "list-school", title: "School", id: "schoolId" },
        { type: "list-attendance", title: "Attendance (School)", id: "school" },
        {
          type: "list-attendance",
          title: "Attendance (Coaching)",
          id: "coaching",
        },
        { type: "text", title: "Center", id: "center" },
        { type: "text", title: "Status", id: "status" },
        { type: "date", title: "Admission", id: "admissionDate" },
        { type: "text", title: "Mother Tongue", id: "motherTongue" },
        { type: "text", title: "Aadhar", id: "has_aadhar" },
        { type: "text", title: "Bank Account", id: "has_bankAccount" },
        { type: "text", title: "Kanyashree", id: "has_kanyashree" },
        { type: "text", title: "Ration Card", id: "has_rationCard" },
        { type: "text", title: "BPL Card", id: "has_BplCard" },
        {
          type: "text",
          title: "Vaccination Status",
          id: "health_vaccinationStatus",
        },
        { type: "text", title: "Blood Group", id: "health_bloodGroup" },
        { type: "text", title: "Eye Status", id: "health_eyeHealthStatus" },
        {
          type: "date",
          title: "Last Eye Check-Up",
          id: "health_lastEyeCheckup",
        },
        {
          type: "date",
          title: "Last Dental Check-Up",
          id: "health_lastDentalCheckup",
        },
        {
          type: "date",
          title: "Last ENT Check-Up",
          id: "health_lastENTCheckup",
        },
        { type: "date", title: "Last Vitamin D", id: "health_lastVitaminD" },
        { type: "date", title: "Last De-Worming", id: "health_lastDeworming" },
      ],
    }),
    queryParams: of({}),
  };

  beforeEach(async(() => {
    const mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    mockSessionService.getCurrentUser.and.returnValue(new User("test1"));
    TestBed.configureTestingModule({
      declarations: [
        ChildBlockComponent,
        SchoolBlockComponent,
        AttendanceBlockComponent,
        ChildrenListComponent,
        AttendanceDaysComponent,
        AttendanceDayBlockComponent,
        ExportDataComponent,
      ],
      imports: [
        CommonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatExpansionModule,
        MatTableModule,
        MatSortModule,
        MatSidenavModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatIconModule,
        MatTooltipModule,
        MatPaginatorModule,
        NoopAnimationsModule,
        FormsModule,
        FilterPipeModule,
        EntitySubrecordModule,
        RouterTestingModule,
      ],
      providers: [
        ChildrenService,
        EntityMapperService,
        EntitySchemaService,
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
        { provide: Database, useClass: MockDatabase },
        {
          provide: ChildPhotoService,
          useValue: jasmine.createSpyObj(["getImage"]),
        },
        { provide: ActivatedRoute, useValue: routeMock },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildrenListComponent);
    component = fixture.componentInstance;
    const router = fixture.debugElement.injector.get(Router);
    fixture.ngZone.run(() => router.initialNavigation());
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
