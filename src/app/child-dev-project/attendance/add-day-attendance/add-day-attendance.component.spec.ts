import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AddDayAttendanceComponent } from "./add-day-attendance.component";
import { ChildrenService } from "../../children/children.service";
import { Database } from "../../../core/database/database";
import { MockDatabase } from "../../../core/database/mock-database";
import { ChildrenModule } from "../../children/children.module";
import { SchoolsModule } from "../../schools/schools.module";
import { MatNativeDateModule } from "@angular/material/core";
import { RouterTestingModule } from "@angular/router/testing";

describe("AddDayAttendanceComponent", () => {
  let component: AddDayAttendanceComponent;
  let fixture: ComponentFixture<AddDayAttendanceComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          ChildrenModule,
          SchoolsModule,
          MatNativeDateModule,
          RouterTestingModule,
        ],
        providers: [
          ChildrenService,
          { provide: Database, useClass: MockDatabase },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AddDayAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
