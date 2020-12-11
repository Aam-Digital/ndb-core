import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { HealthCheckupComponent } from "./health-checkup.component";
import { of } from "rxjs";
import { Child } from "../../children/model/child";
import { CommonModule, DatePipe } from "@angular/common";
import { ChildrenService } from "../../children/children.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ConfirmationDialogService } from "app/core/confirmation-dialog/confirmation-dialog.service";
import { AlertService } from "app/core/alerts/alert.service";

describe("HealthCheckupComponent", () => {
  let component: HealthCheckupComponent;
  let fixture: ComponentFixture<HealthCheckupComponent>;

  const mockChildrenService = {
    getChild: () => {
      return of([new Child("22")]);
    },
    getEducationalMaterialsOfChild: () => {
      return of([]);
    },
    getHealthChecksOfChild: () => {
      return of([]);
    },
  };
  const mockEntityMapper = jasmine.createSpyObj("mockEntityMapper", [
    "save",
    "remove",
  ]);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HealthCheckupComponent],
      imports: [CommonModule, NoopAnimationsModule],
      providers: [
        DatePipe,
        MatSnackBar,
        ConfirmationDialogService,
        MatDialog,
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
        AlertService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthCheckupComponent);
    component = fixture.componentInstance;
    component.child = new Child("22");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
