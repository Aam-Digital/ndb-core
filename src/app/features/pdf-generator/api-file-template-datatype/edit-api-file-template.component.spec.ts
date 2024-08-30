import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditApiFileTemplateComponent } from "./edit-api-file-template.component";
import { AlertService } from "../../../core/alerts/alert.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { PdfGeneratorApiService } from "../pdf-generator-api/pdf-generator-api.service";

describe("EditApiFileTemplateComponent", () => {
  let component: EditApiFileTemplateComponent;
  let fixture: ComponentFixture<EditApiFileTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditApiFileTemplateComponent],
      providers: [
        { provide: AlertService, useValue: null },
        { provide: EntityMapperService, useValue: null },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
        { provide: PdfGeneratorApiService, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditApiFileTemplateComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
