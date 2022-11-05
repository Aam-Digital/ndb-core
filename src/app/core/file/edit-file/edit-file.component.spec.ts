import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { EditFileComponent } from "./edit-file.component";
import { FileModule } from "../file.module";
import { AlertService } from "../../alerts/alert.service";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { FormControl } from "@angular/forms";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { of, throwError } from "rxjs";
import { Entity } from "app/core/entity/model/entity";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FileService } from "../file.service";

describe("EditFileComponent", () => {
  let component: EditFileComponent;
  let fixture: ComponentFixture<EditFileComponent>;
  let mockFileService: jasmine.SpyObj<FileService>;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;
  let mockAlertService: jasmine.SpyObj<AlertService>;
  const file = { name: "test.file" } as File;
  const fileEvent = { target: { files: [file] } };

  beforeEach(async () => {
    mockFileService = jasmine.createSpyObj([
      "uploadFile",
      "showFile",
      "removeFile",
    ]);
    mockConfirmationDialog = jasmine.createSpyObj(["getConfirmation"]);
    mockAlertService = jasmine.createSpyObj(["addDanger", "addInfo"]);
    await TestBed.configureTestingModule({
      imports: [FileModule, FontAwesomeTestingModule, NoopAnimationsModule],
      providers: [
        { provide: AlertService, useValue: mockAlertService },
        { provide: FileService, useValue: mockFileService },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditFileComponent);
    component = fixture.componentInstance;
    component.formControl = new FormControl("");
    component.entity = new Entity();
    component.formControlName = "testProp";
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("update the form after successfully uploading the file", () => {
    mockFileService.uploadFile.and.returnValue(of({ ok: true }));

    component.onFileSelected(fileEvent);

    expect(mockFileService.uploadFile).toHaveBeenCalledWith(
      file,
      component.entity,
      component.formControlName
    );
    expect(component.formControl).toHaveValue(file.name);
  });

  it("should not replace existing file if user declines", fakeAsync(() => {
    mockFileService.uploadFile.and.returnValue(of({ ok: true }));
    mockConfirmationDialog.getConfirmation.and.resolveTo(false);
    component.formControl.setValue("existing.file");

    component.onFileSelected(fileEvent);
    tick();

    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalled();
    expect(mockFileService.uploadFile).not.toHaveBeenCalled();
  }));

  it("should show upload errors as an alert", () => {
    mockFileService.uploadFile.and.returnValue(throwError(() => new Error()));

    component.onFileSelected(fileEvent);

    expect(mockAlertService.addDanger).toHaveBeenCalled();
    expect(component.formControl).not.toHaveValue(file.name);
  });

  it("should show a file when clicking on the form element", () => {
    component.formControl.disable();
    component.formControl.setValue("existing.file");

    component.formClicked();

    expect(mockFileService.showFile).toHaveBeenCalledWith(
      component.entity,
      component.formControlName
    );
  });

  it("should not open a file if no value is set", () => {
    component.fileClicked();

    expect(mockFileService.showFile).not.toHaveBeenCalled();
  });

  it("should reset the form control after a file has been deleted", fakeAsync(() => {
    mockConfirmationDialog.getConfirmation.and.resolveTo(true);
    mockFileService.removeFile.and.returnValue(of({ ok: true }));
    component.formControl.setValue("existing.file");

    component.delete();
    tick();

    expect(mockFileService.removeFile).toHaveBeenCalledWith(
      component.entity,
      component.formControlName
    );
    expect(component.formControl).toHaveValue(undefined);
    expect(mockAlertService.addInfo).toHaveBeenCalled();
  }));

  it("should not remove a file if the user declines", fakeAsync(() => {
    mockConfirmationDialog.getConfirmation.and.resolveTo(false);
    component.formControl.setValue("existing.file");

    component.delete();
    tick();

    expect(mockFileService.removeFile).not.toHaveBeenCalled();
    expect(component.formControl).toHaveValue("existing.file");
    expect(mockAlertService.addInfo).not.toHaveBeenCalled();
  }));
});
