import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditTemplateExportFileComponent } from "./edit-template-export-file.component";
import { AlertService } from "../../../core/alerts/alert.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { TemplateExportApiService } from "../template-export-api/template-export-api.service";

describe("EditTemplateExportFileComponent", () => {
  let component: EditTemplateExportFileComponent;
  let fixture: ComponentFixture<EditTemplateExportFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTemplateExportFileComponent],
      providers: [
        { provide: AlertService, useValue: null },
        { provide: EntityMapperService, useValue: null },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
        { provide: TemplateExportApiService, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTemplateExportFileComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
