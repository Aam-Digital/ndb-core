import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TemplateExportSelectionDialogComponent } from "./template-export-selection-dialog.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../../core/entity/model/entity";
import {
  TemplateExportApiService,
  TemplateExportBatchResult,
  TemplateExportResult,
} from "../template-export-api/template-export-api.service";
import { DownloadService } from "../../../core/export/download-service/download.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { EntityAbility } from "../../../core/permissions/ability/entity-ability";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import {
  entityRegistry,
  EntityRegistry,
} from "../../../core/entity/database-entity.decorator";
import { ActivatedRoute } from "@angular/router";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EMPTY, of, throwError } from "rxjs";
import { AlertService } from "../../../core/alerts/alert.service";
import { TemplateExport } from "../template-export.entity";
import { TemplateExportService } from "../template-export-service/template-export.service";
import { NAVIGATOR_TOKEN } from "#src/app/utils/di-tokens";
import type { Mock } from "vitest";

type DialogRefMock = {
  close: Mock;
};

type TemplateExportApiServiceMock = {
  generatePdfFromTemplate: Mock;
  generateBatchFromTemplate: Mock;
};

type DownloadServiceMock = {
  triggerDownload: Mock;
};

type AlertServiceMock = {
  addInfo: Mock;
  addWarning: Mock;
};

type TemplateExportServiceMock = {
  isExportServerEnabled: Mock;
};

describe("TemplateExportSelectionDialogComponent", () => {
  let component: TemplateExportSelectionDialogComponent;
  let fixture: ComponentFixture<TemplateExportSelectionDialogComponent>;

  let mockDialogRef: DialogRefMock;
  let mockPdfGeneratorApiService: TemplateExportApiServiceMock;
  let mockDownloadService: DownloadServiceMock;
  let mockAlertService: AlertServiceMock;
  let mockTemplateExportService: TemplateExportServiceMock;
  let mockEntityMapperLoad: Mock;
  let loadedTemplate: TemplateExport;
  let testEntity: Entity;

  async function configureBaseTestingModule(dialogData: unknown) {
    await TestBed.configureTestingModule({
      imports: [
        TemplateExportSelectionDialogComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: TemplateExportApiService,
          useValue: mockPdfGeneratorApiService,
        },
        { provide: DownloadService, useValue: mockDownloadService },
        {
          provide: EntityAbility,
          useValue: { cannot: vi.fn(), on: vi.fn(() => () => null) },
        },
        {
          provide: EntityMapperService,
          useValue: {
            load: mockEntityMapperLoad,
            loadType: vi.fn().mockResolvedValue([]),
            receiveUpdates: vi.fn().mockReturnValue(EMPTY),
          },
        },
        { provide: ActivatedRoute, useValue: null },
        { provide: AlertService, useValue: mockAlertService },
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: TemplateExportService,
          useValue: mockTemplateExportService,
        },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
      ],
    }).compileComponents();
  }

  beforeEach(async () => {
    testEntity = new TestEntity();

    mockPdfGeneratorApiService = {
      generatePdfFromTemplate: vi.fn(),
      generateBatchFromTemplate: vi.fn(),
    };
    mockDownloadService = {
      triggerDownload: vi.fn(),
    };
    mockAlertService = {
      addInfo: vi.fn(),
      addWarning: vi.fn(),
    };
    mockDialogRef = {
      close: vi.fn(),
    };
    mockTemplateExportService = {
      isExportServerEnabled: vi.fn(),
    };
    mockTemplateExportService.isExportServerEnabled.mockReturnValue(
      Promise.resolve(true),
    );

    loadedTemplate = new TemplateExport("template-1");
    loadedTemplate.title = "TestTemplate";
    mockEntityMapperLoad = vi.fn().mockResolvedValue(loadedTemplate);

    await configureBaseTestingModule(testEntity);

    fixture = TestBed.createComponent(TemplateExportSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should resolve the feature-enabled flag to true when the export server is available", async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isFeatureEnabled.value()).toBe(true);
  });

  it("should resolve the feature-enabled flag to false when the export server is unavailable", async () => {
    mockTemplateExportService.isExportServerEnabled.mockReturnValue(
      Promise.resolve(false),
    );
    fixture = TestBed.createComponent(TemplateExportSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isFeatureEnabled.value()).toBe(false);
  });

  it("should only show applicable templates for the entity type", () => {
    const template1 = new TemplateExport();
    template1.applicableForEntityTypes = [TestEntity.ENTITY_TYPE];
    expect(component.templateEntityFilter(template1)).toBe(true);

    const template2 = new TemplateExport();
    template2.applicableForEntityTypes = ["other type", TestEntity.ENTITY_TYPE];
    expect(component.templateEntityFilter(template2)).toBe(true);

    const template3 = new TemplateExport();
    template3.applicableForEntityTypes = ["other type"];
    expect(component.templateEntityFilter(template3)).toBe(false);
  });

  it("should normalize a single-entity dialog payload to a one-element entities array", async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.entities()).toEqual([testEntity]);
    expect(component.isBulk()).toBe(false);
  });

  it("should initialize the phase state machine to 'select' with empty totals and failures", async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.phase()).toBe("select");
    expect(component.totalRecords()).toBe(0);
    expect(component.failures()).toEqual([]);
  });

  it("should trigger download with API response when requesting file", async () => {
    const mockResponse: TemplateExportResult = {
      filename: "test.pdf",
      file: new ArrayBuffer(10),
    };
    mockPdfGeneratorApiService.generatePdfFromTemplate.mockReturnValue(
      of(mockResponse),
    );
    component.templateSelectionForm.setValue("template-1");

    await component.requestFile();

    expect(
      mockPdfGeneratorApiService.generatePdfFromTemplate,
    ).toHaveBeenCalled();
    expect(mockDownloadService.triggerDownload).toHaveBeenCalledWith(
      mockResponse.file,
      "pdf",
      mockResponse.filename,
    );
    expect(mockAlertService.addInfo).toHaveBeenCalledWith(
      "Generated 1 of 1 files.",
    );
    // dialog auto-closes on success — implicitly verifies the done-summary is never rendered
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it("should not trigger download for a failed API request and record the failure", async () => {
    mockPdfGeneratorApiService.generatePdfFromTemplate.mockReturnValue(
      throwError(() => new Error("boom")),
    );
    component.templateSelectionForm.setValue("template-1");

    await component.requestFile();

    expect(mockDownloadService.triggerDownload).not.toHaveBeenCalled();
    expect(component.failures().length).toBe(1);
    expect(component.failures()[0].entity).toBe(testEntity);
    expect(component.phase()).toBe("done");
    expect(mockAlertService.addInfo).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  describe("bulk mode (multiple entities)", () => {
    let bulkFixture: ComponentFixture<TemplateExportSelectionDialogComponent>;
    let bulkComponent: TemplateExportSelectionDialogComponent;
    let entityA: TestEntity;
    let entityB: TestEntity;

    beforeEach(async () => {
      entityA = new TestEntity("a");
      entityA.name = "Anna";
      entityB = new TestEntity("b");
      entityB.name = "Ben";

      TestBed.resetTestingModule();
      await configureBaseTestingModule([entityA, entityB]);

      bulkFixture = TestBed.createComponent(
        TemplateExportSelectionDialogComponent,
      );
      bulkFixture.detectChanges();
      await bulkFixture.whenStable();
      bulkComponent = bulkFixture.componentInstance;
      bulkComponent.templateSelectionForm.setValue("template-1");
    });

    it("should expose the entities array as-is for an array dialog payload", () => {
      expect(bulkComponent.entities()).toEqual([entityA, entityB]);
      expect(bulkComponent.isBulk()).toBe(true);
    });

    it("should call the batch endpoint once with the array and trigger a single zip download", async () => {
      const batchResponse: TemplateExportBatchResult = {
        filename: "report.zip",
        file: new ArrayBuffer(16),
      };
      mockPdfGeneratorApiService.generateBatchFromTemplate.mockReturnValue(
        of(batchResponse),
      );

      await bulkComponent.requestFile();

      expect(
        mockPdfGeneratorApiService.generatePdfFromTemplate,
      ).not.toHaveBeenCalled();
      expect(
        mockPdfGeneratorApiService.generateBatchFromTemplate,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockPdfGeneratorApiService.generateBatchFromTemplate,
      ).toHaveBeenCalledWith(loadedTemplate, [entityA, entityB], "zip");
      expect(mockDownloadService.triggerDownload).toHaveBeenCalledTimes(1);
      expect(mockDownloadService.triggerDownload).toHaveBeenCalledWith(
        batchResponse.file,
        "zip",
        "report.zip",
      );
      expect(bulkComponent.failures()).toEqual([]);
      expect(mockAlertService.addInfo).toHaveBeenCalledWith(
        "Generated 2 of 2 files.",
      );
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it("should use combined mode and download a single PDF when the combine-into-single-PDF signal is enabled", async () => {
      bulkComponent.combineIntoSinglePdf.set(true);

      const combinedResponse: TemplateExportBatchResult = {
        filename: "combined.pdf",
        file: new ArrayBuffer(16),
      };
      mockPdfGeneratorApiService.generateBatchFromTemplate.mockReturnValue(
        of(combinedResponse),
      );

      await bulkComponent.requestFile();

      expect(
        mockPdfGeneratorApiService.generateBatchFromTemplate,
      ).toHaveBeenCalledWith(loadedTemplate, [entityA, entityB], "combined");
      expect(mockDownloadService.triggerDownload).toHaveBeenCalledWith(
        combinedResponse.file,
        "pdf",
        "combined.pdf",
      );
      expect(mockAlertService.addInfo).toHaveBeenCalledWith(
        "Generated 2 of 2 files.",
      );
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it("should mark all selected entities as failed when the bulk request errors out", async () => {
      mockPdfGeneratorApiService.generateBatchFromTemplate.mockReturnValue(
        throwError(() => new Error("Cannot process more than 200 documents")),
      );

      await bulkComponent.requestFile();

      expect(bulkComponent.phase()).toBe("done");
      expect(bulkComponent.failures().length).toBe(2);
      expect(bulkComponent.failures().map((f) => f.entity)).toEqual([
        entityA,
        entityB,
      ]);
      expect(bulkComponent.failedEntityNames()).toContain("Anna");
      expect(bulkComponent.failedEntityNames()).toContain("Ben");
      expect(mockAlertService.addInfo).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  it("should warn and skip the API when invoked with an empty entity array", async () => {
    TestBed.resetTestingModule();
    await configureBaseTestingModule([]);

    const emptyFixture = TestBed.createComponent(
      TemplateExportSelectionDialogComponent,
    );
    emptyFixture.detectChanges();
    await emptyFixture.whenStable();

    emptyFixture.componentInstance.templateSelectionForm.setValue("template-1");
    await emptyFixture.componentInstance.requestFile();

    expect(mockAlertService.addWarning).toHaveBeenCalled();
    expect(
      mockPdfGeneratorApiService.generatePdfFromTemplate,
    ).not.toHaveBeenCalled();
    expect(
      mockPdfGeneratorApiService.generateBatchFromTemplate,
    ).not.toHaveBeenCalled();
  });
});
