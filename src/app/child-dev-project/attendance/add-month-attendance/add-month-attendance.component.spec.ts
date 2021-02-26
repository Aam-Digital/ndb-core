import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AddMonthAttendanceComponent } from "./add-month-attendance.component";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSelectModule } from "@angular/material/select";
import { MatTableModule } from "@angular/material/table";
import { FormsModule } from "@angular/forms";
import { SchoolBlockComponent } from "../../schools/school-block/school-block.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { MockDatabase } from "../../../core/database/mock-database";
import { Database } from "../../../core/database/database";
import { ChildrenService } from "../../children/children.service";
import { AlertsModule } from "../../../core/alerts/alerts.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { ChildPhotoService } from "../../children/child-photo-service/child-photo.service";
import { RouterTestingModule } from "@angular/router/testing";
import { ChildBlockComponent } from "../../children/child-block/child-block.component";
import { EntitySubrecordModule } from "../../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { ConfirmationDialogModule } from "../../../core/confirmation-dialog/confirmation-dialog.module";

describe("AddMonthAttendanceComponent", () => {
  let component: AddMonthAttendanceComponent;
  let fixture: ComponentFixture<AddMonthAttendanceComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [
          AddMonthAttendanceComponent,
          SchoolBlockComponent,
          ChildBlockComponent,
        ],
        imports: [
          MatButtonToggleModule,
          MatSelectModule,
          MatFormFieldModule,
          MatIconModule,
          MatCheckboxModule,
          MatInputModule,
          MatTableModule,
          MatButtonModule,
          MatProgressBarModule,
          FormsModule,
          AlertsModule,
          NoopAnimationsModule,
          RouterTestingModule,
          EntitySubrecordModule,
          ConfirmationDialogModule,
        ],
        providers: [
          EntityMapperService,
          EntitySchemaService,
          { provide: Database, useClass: MockDatabase },
          ChildrenService,
          {
            provide: ChildPhotoService,
            useValue: jasmine.createSpyObj(["getImage"]),
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMonthAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
