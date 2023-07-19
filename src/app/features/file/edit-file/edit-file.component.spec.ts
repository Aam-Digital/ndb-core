import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditFileComponent } from "./edit-file.component";
import { AlertService } from "../../../core/alerts/alert.service";
import { FormControl } from "@angular/forms";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { of, Subject } from "rxjs";
import { Entity } from "app/core/entity/model/entity";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FileService } from "../file.service";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";

describe("EditFileComponent", () => {
  let component: EditFileComponent;
  let fixture: ComponentFixture<EditFileComponent>;
  let mockFileService: jasmine.SpyObj<FileService>;
  let mockAlertService: jasmine.SpyObj<AlertService>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  const file = new File([], "test.file");

  beforeEach(async () => {
    mockFileService = jasmine.createSpyObj([
      "uploadFile",
      "showFile",
      "removeFile",
    ]);
    mockAlertService = jasmine.createSpyObj(["addDanger", "addInfo"]);
    mockEntityMapper = jasmine.createSpyObj(["save"]);
    await TestBed.configureTestingModule({
      imports: [
        EditFileComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        EntitySchemaService,
        { provide: AlertService, useValue: mockAlertService },
        { provide: FileService, useValue: mockFileService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditFileComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not upload a file that was selected but the process was canceled", () => {
    setupComponent();
    component.formControl.enable();

    component.onFileSelected(file);
    expect(component.formControl).toHaveValue(file.name);
    cancelForm();

    expect(component.formControl).toHaveValue(null);
    expect(mockFileService.uploadFile).not.toHaveBeenCalled();
  });

  it("should not remove or upload a file if a file was selected and then removed and then canceled", () => {
    setupComponent();
    component.formControl.enable();

    component.onFileSelected(file);
    expect(component.formControl).toHaveValue(file.name);

    component.delete();

    cancelForm();

    expect(component.formControl).toHaveValue(null);
    expect(mockFileService.uploadFile).not.toHaveBeenCalled();
    expect(mockFileService.removeFile).not.toHaveBeenCalled();
  });

  it("should not remove or upload a file if a file was selected, replaced and canceled", () => {
    setupComponent();
    component.formControl.enable();

    component.onFileSelected(file);
    expect(component.formControl).toHaveValue(file.name);

    const otherFile = new File([], "other.file");
    component.onFileSelected(otherFile);
    expect(component.formControl).toHaveValue("other.file");

    cancelForm();

    expect(component.formControl).toHaveValue(null);
    expect(mockFileService.uploadFile).not.toHaveBeenCalled();
    expect(mockFileService.removeFile).not.toHaveBeenCalled();
  });

  it("should upload a file if a new file was selected and the form saved", () => {
    setupComponent();
    mockFileService.uploadFile.and.returnValue(of({ ok: true }));
    component.formControl.enable();

    component.onFileSelected(file);
    expect(component.formControl).toHaveValue(file.name);

    component.formControl.disable();

    expect(component.formControl).toHaveValue(file.name);
    expect(mockFileService.uploadFile).toHaveBeenCalledWith(
      file,
      component.entity,
      component.formControlName
    );
  });

  it("should not remove or upload a file if a file was selected, then removed and then saved", () => {
    setupComponent();
    component.formControl.enable();

    component.onFileSelected(file);
    expect(component.formControl).toHaveValue(file.name);

    component.delete();

    component.formControl.disable();

    expect(component.formControl).toHaveValue(null);
    expect(mockFileService.uploadFile).not.toHaveBeenCalled();
    expect(mockFileService.removeFile).not.toHaveBeenCalled();
  });

  it("should only upload the last file if a file was selected and then replaced", () => {
    setupComponent();
    mockFileService.uploadFile.and.returnValue(of({ ok: true }));
    component.formControl.enable();

    component.onFileSelected(file);
    expect(component.formControl).toHaveValue(file.name);

    const otherFile = new File([], "other.file");
    component.onFileSelected(otherFile);
    expect(component.formControl).toHaveValue(otherFile.name);

    component.formControl.disable();

    expect(component.formControl).toHaveValue(otherFile.name);
    expect(mockFileService.removeFile).not.toHaveBeenCalled();
    expect(mockFileService.uploadFile).toHaveBeenCalledWith(
      otherFile,
      component.entity,
      component.formControlName
    );
  });

  it("should not remove a file if the file input was cleared but then canceled", () => {
    setupComponent(file.name);
    component.formControl.enable();

    component.delete();
    expect(component.formControl).toHaveValue(null);

    cancelForm();

    expect(component.formControl).toHaveValue(file.name);
    expect(mockFileService.removeFile).not.toHaveBeenCalled();
  });

  it("should not remove and upload a file if the file was replaced but then canceled", () => {
    setupComponent(file.name);
    component.formControl.enable();

    const otherFile = new File([], "other.file");
    component.onFileSelected(otherFile);
    expect(component.formControl).toHaveValue("other.file");

    cancelForm();

    expect(component.formControl).toHaveValue(file.name);
    expect(mockFileService.removeFile).not.toHaveBeenCalled();
    expect(mockFileService.uploadFile).not.toHaveBeenCalled();
  });

  it("should remove a file if the file input was cleared and saved", () => {
    mockFileService.removeFile.and.returnValue(of({ ok: true }));
    setupComponent(file.name);
    component.formControl.enable();

    component.delete();
    expect(component.formControl).toHaveValue(null);

    component.formControl.disable();

    expect(component.formControl).toHaveValue(null);
    expect(mockFileService.removeFile).toHaveBeenCalledWith(
      component.entity,
      component.formControlName
    );
    expect(mockAlertService.addInfo).toHaveBeenCalled();
  });

  it("should upload the new file if the file was replaced and then saved", () => {
    mockFileService.uploadFile.and.returnValue(of({ ok: true }));
    setupComponent(file.name);
    component.formControl.enable();

    const otherFile = new File([], "other.file");
    component.onFileSelected(otherFile);

    component.formControl.disable();

    expect(component.formControl).toHaveValue(otherFile.name);
    expect(mockFileService.removeFile).not.toHaveBeenCalled();
    expect(mockFileService.uploadFile).toHaveBeenCalledWith(
      otherFile,
      component.entity,
      component.formControlName
    );
  });

  it("should show upload errors as an alert and reset entity", () => {
    setupComponent("old.file");
    const subject = new Subject();
    mockFileService.uploadFile.and.returnValue(subject);
    component.formControl.enable();

    component.onFileSelected(file);

    component.entity[component.formControlName] = file.name;
    component.formControl.disable();

    expect(component.formControl).toHaveValue(file.name);
    expect(component.entity[component.formControlName]).toBe(file.name);

    subject.error(new Error());

    expect(mockAlertService.addDanger).toHaveBeenCalled();
    expect(component.formControl).toHaveValue("old.file");
    expect(component.entity[component.formControlName]).toBe("old.file");
    expect(mockEntityMapper.save).toHaveBeenCalledWith(component.entity);
  });

  it("should show a file when clicking on the form element", () => {
    setupComponent("existing.file");

    component.formClicked();

    expect(mockFileService.showFile).toHaveBeenCalledWith(
      component.entity,
      component.formControlName
    );
  });

  it("should not open a file if no value is set", () => {
    setupComponent();
    component.fileClicked();

    expect(mockFileService.showFile).not.toHaveBeenCalled();
  });

  let initialValue: string;

  function setupComponent(value = null) {
    initialValue = value;
    component.formControl = new FormControl(initialValue);
    component.entity = Object.assign(new Entity(), { testProp: initialValue });
    component.formFieldConfig = { id: "testProp" };
    component.formControl.disable();
    fixture.detectChanges();
  }

  function cancelForm() {
    component.formControl.setValue(initialValue);
    component.formControl.disable();
  }
});
