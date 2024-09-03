import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FileTemplateSelectionDialogComponent } from "./file-template-selection-dialog.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../../../core/entity/model/entity";
import { PdfGeneratorApiService } from "../../pdf-generator-api/pdf-generator-api.service";
import { DownloadService } from "../../../../core/export/download-service/download.service";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { EntityAbility } from "../../../../core/permissions/ability/entity-ability";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { ActivatedRoute } from "@angular/router";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("FileTemplateSelectionDialogComponent", () => {
  let component: FileTemplateSelectionDialogComponent;
  let fixture: ComponentFixture<FileTemplateSelectionDialogComponent>;

  let mockPdfGeneratorApiService: jasmine.SpyObj<PdfGeneratorApiService>;
  let mockDownloadService: jasmine.SpyObj<DownloadService>;

  let testEntity: Entity;

  beforeEach(async () => {
    testEntity = new TestEntity();

    const mockAbility = jasmine.createSpyObj(["cannot", "on"]);
    mockAbility.on.and.returnValue(() => null);

    await TestBed.configureTestingModule({
      imports: [
        FileTemplateSelectionDialogComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: testEntity },
        { provide: MatDialogRef, useValue: jasmine.createSpyObj(["close"]) },
        {
          provide: PdfGeneratorApiService,
          useValue: mockPdfGeneratorApiService,
        },
        { provide: DownloadService, useValue: mockDownloadService },
        // required by child components:
        { provide: EntityAbility, useValue: mockAbility },
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        EntityRegistry,
        { provide: ActivatedRoute, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FileTemplateSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
