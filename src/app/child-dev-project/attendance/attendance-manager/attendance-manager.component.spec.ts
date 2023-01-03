import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceManagerComponent } from "./attendance-manager.component";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { RouterTestingModule } from "@angular/router/testing";
import { ComingSoonDialogService } from "../../../core/coming-soon/coming-soon-dialog.service";
import { ViewTitleComponent } from "../../../core/entity-components/entity-utils/view-title/view-title.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AttendanceManagerComponent", () => {
  let component: AttendanceManagerComponent;
  let fixture: ComponentFixture<AttendanceManagerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AttendanceManagerComponent, ViewTitleComponent],
      imports: [
        MatButtonModule,
        MatCardModule,
        RouterTestingModule,
        FontAwesomeTestingModule,
      ],
      providers: [{ provide: ComingSoonDialogService, useValue: null }],
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
