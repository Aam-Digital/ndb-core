import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FormControl } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { Entity } from "app/core/entity/model/entity";
import { of, Subject } from "rxjs";
import { AlertService } from "../../../core/alerts/alert.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { FileFieldConfig } from "../file.datatype";
import { FileService } from "../file.service";
import { EditFileComponent } from "./edit-file.component";

describe("EditFileComponent", () => {
  let component: EditFileComponent;
  let fixture: ComponentFixture<EditFileComponent>;
  let mockFileService: any;
  let mockAlertService: any;
  let mockEntityMapper: any;

  const file = new File([], "test.file");

  beforeEach(async () => {
    mockFileService = {
      uploadFile: vi.fn(),
      showFile: vi.fn(),
      removeFile: vi.fn(),
    };
    mockAlertService = {
      addDanger: vi.fn(),
      addInfo: vi.fn(),
    };
    mockEntityMapper = {
      save: vi.fn(),
      load: vi.fn(),
    };
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
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditFileComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should use acceptedFileTypes from field config", () => {
    setupComponent();
    component.formFieldConfig = {
      id: "testProp",
      dataType: "file",
      additional: { acceptedFileTypes: ".png" } as FileFieldConfig,
    };

    component.ngOnInit();

    expect(component.acceptedFileTypes).toBe(".png");
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
    mockFileService.uploadFile.mockReturnValue(of({ ok: true }));
    component.formControl.enable();

    component.onFileSelected(file);
    expect(component.formControl).toHaveValue(file.name);

    component.formControl.disable();

    expect(component.formControl).toHaveValue(file.name);
    expect(mockFileService.uploadFile).toHaveBeenCalledWith(
      file,
      component.entity,
      component.formFieldConfig.id,
    );
  });

  it("should not remove or upload a file if a file was selected, then removed and then saved", () => {
    setupComponent();
    component.formControl.enable();

    component.onFileSelected(file);
    expect(component.formControl).toHaveValue(file.name);

    component.delete();

    component.formControl.disable();

    expect(component.formControl).toHaveValue(undefined);
    expect(mockFileService.uploadFile).not.toHaveBeenCalled();
    expect(mockFileService.removeFile).not.toHaveBeenCalled();
  });

  it("should only upload the last file if a file was selected and then replaced", () => {
    setupComponent();
    mockFileService.uploadFile.mockReturnValue(of({ ok: true }));
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
      component.formFieldConfig.id,
    );
  });

  it("should not remove a file if the file input was cleared but then canceled", () => {
    setupComponent(file.name);
    component.formControl.enable();

    component.delete();
    expect(component.formControl).toHaveValue(undefined);

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
    mockFileService.removeFile.mockReturnValue(of({ ok: true }));
    setupComponent(file.name);
    component.formControl.enable();

    component.delete();
    expect(component.formControl).toHaveValue(undefined);

    component.formControl.disable();

    expect(component.formControl).toHaveValue(undefined);
    expect(mockFileService.removeFile).toHaveBeenCalledWith(
      component.entity,
      component.formFieldConfig.id,
    );
    expect(mockAlertService.addInfo).toHaveBeenCalled();
  });

  it("should upload the new file if the file was replaced and then saved", () => {
    mockFileService.uploadFile.mockReturnValue(of({ ok: true }));
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
      component.formFieldConfig.id,
    );
  });

  it("should show upload errors as an alert and reset entity", async () => {
    vi.useFakeTimers();
    try {
      setupComponent("old.file");
      mockEntityMapper.load.mockResolvedValue(
        Object.assign(new Entity(component.entity.getId()), {
          _rev: "2",
          testProp: "new.file",
        }),
      );
      const subject = new Subject();
      mockFileService.uploadFile.mockReturnValue(subject);
      component.formControl.enable();

      component.onFileSelected(file);

      component.entity[component.formFieldConfig.id] = file.name;
      component.formControl.disable();

      expect(component.formControl).toHaveValue(file.name);
      expect(component.entity[component.formFieldConfig.id]).toBe(file.name);

      subject.error(new Error());
      await vi.advanceTimersByTimeAsync(0);

      expect(mockAlertService.addDanger).toHaveBeenCalled();
      expect(component.formControl).toHaveValue("old.file");
      expect(component.entity[component.formFieldConfig.id]).toBe("old.file");
      expect(mockEntityMapper.save).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: component.entity["_id"],
          _rev: "2",
          testProp: "old.file",
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should show a file when clicking on the form element", () => {
    setupComponent("existing.file");

    component.formClicked();

    expect(mockFileService.showFile).toHaveBeenCalledWith(
      component.entity,
      component.formFieldConfig.id,
    );
  });

  it("should not open a file if no value is set", () => {
    setupComponent();
    component.showFile();

    expect(mockFileService.showFile).not.toHaveBeenCalled();
  });

  let initialValue: string;

  function setupComponent(value = null) {
    initialValue = value;
    component.ngControl = {
      control: new FormControl(initialValue),
    } as any;

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
