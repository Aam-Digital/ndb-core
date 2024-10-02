import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { TemplateExportSelectionDialogComponent } from "./template-export-selection-dialog.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../../core/entity/model/entity";
import {
  TemplateExportApiService,
  TemplateExportResult,
} from "../template-export-api/template-export-api.service";
import { DownloadService } from "../../../core/export/download-service/download.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { EntityAbility } from "../../../core/permissions/ability/entity-ability";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { ActivatedRoute } from "@angular/router";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { delay, of } from "rxjs";
import { map } from "rxjs/operators";
import { AlertService } from "../../../core/alerts/alert.service";
import { TemplateExport } from "../template-export.entity";

describe("TemplateExportSelectionDialogComponent", () => {
  let component: TemplateExportSelectionDialogComponent;
  let fixture: ComponentFixture<TemplateExportSelectionDialogComponent>;

  let mockDialogRef: jasmine.SpyObj<
    MatDialogRef<TemplateExportSelectionDialogComponent>
  >;
  let mockPdfGeneratorApiService: jasmine.SpyObj<TemplateExportApiService>;
  let mockDownloadService: jasmine.SpyObj<DownloadService>;

  let testEntity: Entity;

  beforeEach(async () => {
    testEntity = new TestEntity();

    mockPdfGeneratorApiService = jasmine.createSpyObj([
      "generatePdfFromTemplate",
    ]);
    mockDownloadService = jasmine.createSpyObj(["triggerDownload"]);
    mockDialogRef = jasmine.createSpyObj(["close"]);
    const mockAbility = jasmine.createSpyObj(["cannot", "on"]);
    mockAbility.on.and.returnValue(() => null);

    await TestBed.configureTestingModule({
      imports: [
        TemplateExportSelectionDialogComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: testEntity },
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: TemplateExportApiService,
          useValue: mockPdfGeneratorApiService,
        },
        { provide: DownloadService, useValue: mockDownloadService },
        // required by child components:
        { provide: EntityAbility, useValue: mockAbility },
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        EntityRegistry,
        { provide: ActivatedRoute, useValue: null },
        {
          provide: AlertService,
          useValue: jasmine.createSpyObj(["addWarning"]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateExportSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should only show applicable templates for the entity type", () => {
    const template1 = new TemplateExport();
    template1.applicableForEntityTypes = [TestEntity.ENTITY_TYPE];
    expect(component.templateEntityFilter(template1)).toBeTrue();

    const template2 = new TemplateExport();
    template2.applicableForEntityTypes = ["other type", TestEntity.ENTITY_TYPE];
    expect(component.templateEntityFilter(template2)).toBeTrue();

    const template3 = new TemplateExport();
    template3.applicableForEntityTypes = ["other type"];
    expect(component.templateEntityFilter(template3)).toBeFalse();
  });

  it("should trigger download with API response when requesting file", fakeAsync(() => {
    const entity = new TestEntity();
    entity.name = "test entity";
    component.entity = entity;

    const mockResponse: TemplateExportResult = {
      filename: "test.pdf",
      file: new ArrayBuffer(10),
    };
    mockPdfGeneratorApiService.generatePdfFromTemplate.and.returnValue(
      of(mockResponse).pipe(delay(100)),
    );

    component.requestFile();
    tick(1);
    expect(component.loadingRequestedFile).toBeTrue();
    tick(100);
    expect(component.loadingRequestedFile).toBeFalse();

    expect(
      mockPdfGeneratorApiService.generatePdfFromTemplate,
    ).toHaveBeenCalled();
    expect(mockDownloadService.triggerDownload).toHaveBeenCalledWith(
      mockResponse.file,
      "pdf",
      mockResponse.filename,
    );
    expect(mockDialogRef.close).toHaveBeenCalled();
  }));

  it("should disable loading but not close dialog if API request fails", fakeAsync(() => {
    mockPdfGeneratorApiService.generatePdfFromTemplate.and.returnValue(
      of(false).pipe(
        delay(100),
        map(() => {
          throw new Error();
        }),
      ),
    );

    component.requestFile();
    tick(1);
    expect(component.loadingRequestedFile).toBeTrue();
    tick(100);
    expect(component.loadingRequestedFile).toBeFalse();

    expect(mockDownloadService.triggerDownload).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  }));
});
