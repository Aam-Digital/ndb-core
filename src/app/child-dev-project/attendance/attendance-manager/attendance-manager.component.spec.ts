import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceManagerComponent } from "./attendance-manager.component";
import { RouterTestingModule } from "@angular/router/testing";
import { ComingSoonDialogService } from "../../../features/coming-soon/coming-soon-dialog.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AttendanceManagerComponent", () => {
  let component: AttendanceManagerComponent;
  let fixture: ComponentFixture<AttendanceManagerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        AttendanceManagerComponent,
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
