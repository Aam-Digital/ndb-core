import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { FormBuilder } from "@angular/forms";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { AlertService } from "../../../core/alerts/alert.service";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { DatePipe, Location, PercentPipe } from "@angular/common";
import { Observable } from "rxjs";
import { ChildDetailsComponent } from "./child-details.component";
import { MatSnackBar } from "@angular/material/snack-bar";
import { databaseServiceProvider } from "app/core/database/database.service.provider";
import { SessionService } from "app/core/session/session-service/session.service";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { MockDatabase } from "app/core/database/mock-database";
import { SchoolsService } from "app/child-dev-project/schools/schools.service";
import { ChildPhotoService } from "../child-photo-service/child-photo.service";
import { ChildrenModule } from "../children.module";
import { FormDialogModule } from "../../../core/form-dialog/form-dialog.module";
import { MatNativeDateModule } from "@angular/material/core";

describe("ChildDetailsComponent", () => {
  let component: ChildDetailsComponent;
  let fixture: ComponentFixture<ChildDetailsComponent>;
  const mockedRoute = {
    paramMap: Observable.create((observer) =>
      observer.next({ get: () => "new" })
    ),
  };
  const mockedRouter = { navigate: () => null };
  const mockedLocation = { back: () => null };
  const mockedSnackBar = {
    open: () => {
      return {
        onAction: () => Observable.create((observer) => observer.next()),
      };
    },
  };
  const mockedConfirmationDialog = {
    openDialog: () => {
      return {
        afterClosed: () => Observable.create((observer) => observer(false)),
      };
    },
  };
  const mockedDialog = {
    open: () => {
      return {
        afterClosed: () => Observable.create((observer) => observer(false)),
      };
    },
  };
  const mockedDatabase = new MockDatabase();
  const mockedSession = {
    getCurrentUser: () => "testUser",
    getDatabase: () => mockedDatabase,
  };
  let mockChildPhotoService: jasmine.SpyObj<ChildPhotoService>;

  beforeEach(async(() => {
    mockChildPhotoService = jasmine.createSpyObj("mockChildPhotoService", [
      "canSetImage",
      "setImage",
    ]);

    TestBed.configureTestingModule({
      imports: [ChildrenModule, FormDialogModule, MatNativeDateModule],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        AlertService,
        DatePipe,
        PercentPipe,
        databaseServiceProvider,
        { provide: SessionService, useValue: mockedSession },
        { provide: MatDialog, useValue: mockedDialog },
        {
          provide: ConfirmationDialogService,
          useValue: mockedConfirmationDialog,
        },
        { provide: MatSnackBar, useValue: mockedSnackBar },
        { provide: Location, useValue: mockedLocation },
        { provide: Router, useValue: mockedRouter },
        { provide: ActivatedRoute, useValue: mockedRoute },
        { provide: ChildPhotoService, useValue: mockChildPhotoService },
        FormBuilder,
        SchoolsService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    mockChildPhotoService.canSetImage.and.returnValue(false);
    expect(component).toBeTruthy();
  });

  it("should create with edit mode", () => {
    mockChildPhotoService.canSetImage.and.returnValue(true);
    component.switchEdit();

    fixture.detectChanges();

    expect(component).toBeTruthy();
  });
});
