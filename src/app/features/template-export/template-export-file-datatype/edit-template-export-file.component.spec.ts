import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditTemplateExportFileComponent } from "./edit-template-export-file.component";
import { AlertService } from "../../../core/alerts/alert.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { TemplateExportApiService } from "../template-export-api/template-export-api.service";
import { of } from "rxjs";
import { FileService } from "app/features/file/file.service";

describe("EditTemplateExportFileComponent", () => {
  let component: EditTemplateExportFileComponent;
  let fixture: ComponentFixture<EditTemplateExportFileComponent>;
  let mockFileService: jasmine.SpyObj<FileService>;

  beforeEach(async () => {
    mockFileService = jasmine.createSpyObj([
      "uploadFile",
      "loadFile",
      "removeFile",
    ]);
    mockFileService.loadFile.and.returnValue(of("success"));
    await TestBed.configureTestingModule({
      imports: [EditTemplateExportFileComponent],
      providers: [
        { provide: AlertService, useValue: null },
        { provide: EntityMapperService, useValue: null },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
        { provide: TemplateExportApiService, useValue: null },
        { provide: FileService, useValue: mockFileService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTemplateExportFileComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
