import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { setupCustomFormControlEditComponent } from "#src/app/core/entity/default-datatype/edit-component.spec";
import { SyncStateSubject } from "#src/app/core/session/session-type";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { FileService } from "app/features/file/file.service";
import { of } from "rxjs";
import { AlertService } from "../../../core/alerts/alert.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../../core/entity/model/entity";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { TemplateExportApiService } from "../template-export-api/template-export-api.service";
import { TemplateExportService } from "../template-export-service/template-export.service";
import { FormControl } from "@angular/forms";
import { EditTemplateExportFileComponent } from "./edit-template-export-file.component";

describe("EditTemplateExportFileComponent", () => {
  let component: EditTemplateExportFileComponent;
  let fixture: ComponentFixture<EditTemplateExportFileComponent>;
  let mockFileService: jasmine.SpyObj<FileService>;
  let mockTemplateExportService: jasmine.SpyObj<TemplateExportService>;

  beforeEach(async () => {
    mockFileService = jasmine.createSpyObj([
      "uploadFile",
      "loadFile",
      "removeFile",
    ]);
    mockFileService.loadFile.and.returnValue(of("success"));

    mockTemplateExportService = jasmine.createSpyObj(["isExportServerEnabled"]);
    mockTemplateExportService.isExportServerEnabled.and.returnValue(
      Promise.resolve(true),
    );

    await TestBed.configureTestingModule({
      imports: [EditTemplateExportFileComponent, FontAwesomeTestingModule],
      providers: [
        { provide: AlertService, useValue: {} },
        { provide: EntityMapperService, useValue: {} },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
        { provide: TemplateExportApiService, useValue: {} },
        { provide: FileService, useValue: mockFileService },
        { provide: TemplateExportService, useValue: mockTemplateExportService },
        EntityRegistry,
        SyncStateSubject,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTemplateExportFileComponent);
    component = fixture.componentInstance;

    // Set up the form field config properly
    const formFieldConfig: FormFieldConfig = {
      id: "test",
      additional: {},
    };
    component.entity = new Entity();
    component.formFieldConfig = formFieldConfig; // Set directly first, somehow setup function is not getting things there in time for the child component ...
    setupCustomFormControlEditComponent(component, "test", formFieldConfig);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
