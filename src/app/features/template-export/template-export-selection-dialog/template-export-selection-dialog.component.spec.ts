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
import { EMPTY, of, Subject, throwError } from "rxjs";
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

type TemplateExportServiceMock = {
  isExportServerEnabled: Mock;
};

describe("TemplateExportSelectionDialogComponent", () => {
  let component: TemplateExportSelectionDialogComponent;
  let fixture: ComponentFixture<TemplateExportSelectionDialogComponent>;

  let mockDialogRef: DialogRefMock;
  let mockPdfGeneratorApiService: TemplateExportApiServiceMock;
  let mockDownloadService: DownloadServiceMock;
  let mockTemplateExportService: TemplateExportServiceMock;
  let testEntity: Entity;

  beforeEach(async () => {
    testEntity = new TestEntity();

    mockPdfGeneratorApiService = {
      generatePdfFromTemplate: vi.fn(),
      generateBatchFromTemplate: vi.fn(),
    };
    mockDownloadService = {
      triggerDownload: vi.fn(),
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
    const mockAbility = {
      cannot: vi.fn(),
      on: vi.fn(),
    };
    mockAbility.on.mockReturnValue(() => null);

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
        {
          provide: EntityMapperService,
          useValue: {
            load: vi.fn(),
            loadType: vi.fn().mockResolvedValue([]),
            receiveUpdates: vi.fn().mockReturnValue(EMPTY),
          },
        },
        { provide: ActivatedRoute, useValue: null },
        {
          provide: AlertService,
          useValue: {
            addWarning: vi.fn(),
          },
        },
        {
          provide: EntityRegistry,
          useValue: entityRegistry,
        },
        {
          provide: TemplateExportService,
          useValue: mockTemplateExportService,
        },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateExportSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should show template selection when export feature is enabled", async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isFeatureEnabled.value()).toBe(true);
    expect(
      fixture.nativeElement.querySelector("app-edit-entity"),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector(".feature-disabled-box"),
    ).toBeNull();
  });

  it("should show feature-disabled info when export feature is disabled", async () => {
    mockTemplateExportService.isExportServerEnabled.mockReturnValue(
      Promise.resolve(false),
    );
    fixture = TestBed.createComponent(TemplateExportSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isFeatureEnabled.value()).toBe(false);
    expect(fixture.nativeElement.querySelector("app-edit-entity")).toBeNull();
    expect(
      fixture.nativeElement.querySelector(".feature-disabled-box"),
    ).not.toBeNull();
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

  it("should expose the entities array as-is for an array dialog payload (bulk)", async () => {
    const entityA = new TestEntity("a");
    const entityB = new TestEntity("b");
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        TemplateExportSelectionDialogComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: [entityA, entityB] },
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
            load: vi.fn(),
            loadType: vi.fn().mockResolvedValue([]),
            receiveUpdates: vi.fn().mockReturnValue(EMPTY),
          },
        },
        { provide: ActivatedRoute, useValue: null },
        { provide: AlertService, useValue: { addWarning: vi.fn() } },
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: TemplateExportService,
          useValue: mockTemplateExportService,
        },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
      ],
    }).compileComponents();

    const bulkFixture = TestBed.createComponent(
      TemplateExportSelectionDialogComponent,
    );
    bulkFixture.detectChanges();
    await bulkFixture.whenStable();

    expect(bulkFixture.componentInstance.entities()).toEqual([
      entityA,
      entityB,
    ]);
    expect(bulkFixture.componentInstance.isBulk()).toBe(true);
  });

  it("should initialize the phase state machine to 'select' with empty totals and failures", async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.phase()).toBe("select");
    expect(component.totalRecords()).toBe(0);
    expect(component.failures()).toEqual([]);
    expect(component.cancelRequested()).toBe(false);
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
    expect(component.phase()).toBe("done");
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
  });

  it("should call the batch endpoint once with the array and trigger a single zip download for bulk input", async () => {
    const entityA = new TestEntity("a");
    const entityB = new TestEntity("b");

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        TemplateExportSelectionDialogComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: [entityA, entityB] },
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
            load: vi.fn(),
            loadType: vi.fn().mockResolvedValue([]),
            receiveUpdates: vi.fn().mockReturnValue(EMPTY),
          },
        },
        { provide: ActivatedRoute, useValue: null },
        { provide: AlertService, useValue: { addWarning: vi.fn() } },
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: TemplateExportService,
          useValue: mockTemplateExportService,
        },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
      ],
    }).compileComponents();

    const bulkFixture = TestBed.createComponent(
      TemplateExportSelectionDialogComponent,
    );
    bulkFixture.detectChanges();
    await bulkFixture.whenStable();
    const bulkComponent = bulkFixture.componentInstance;
    bulkComponent.templateSelectionForm.setValue("template-1");

    const batchResponse: TemplateExportBatchResult = {
      filename: "report.zip",
      file: new ArrayBuffer(16),
      failedIndices: [],
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
      mockPdfGeneratorApiService.generateBatchFromTemplate.mock.calls[0],
    ).toEqual(["template-1", [entityA, entityB]]);
    expect(mockDownloadService.triggerDownload).toHaveBeenCalledTimes(1);
    expect(mockDownloadService.triggerDownload).toHaveBeenCalledWith(
      batchResponse.file,
      "zip",
      "report.zip",
    );
    expect(bulkComponent.phase()).toBe("done");
    expect(bulkComponent.failures()).toEqual([]);
  });

  it("should hide the single-entity header when more than one entity is provided", async () => {
    const entityA = new TestEntity("a");
    const entityB = new TestEntity("b");

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        TemplateExportSelectionDialogComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: [entityA, entityB] },
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
            load: vi.fn(),
            loadType: vi.fn().mockResolvedValue([]),
            receiveUpdates: vi.fn().mockReturnValue(EMPTY),
          },
        },
        { provide: ActivatedRoute, useValue: null },
        { provide: AlertService, useValue: { addWarning: vi.fn() } },
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: TemplateExportService,
          useValue: mockTemplateExportService,
        },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
      ],
    }).compileComponents();

    const bulkFixture = TestBed.createComponent(
      TemplateExportSelectionDialogComponent,
    );
    bulkFixture.detectChanges();
    await bulkFixture.whenStable();
    bulkFixture.detectChanges();

    const header = bulkFixture.nativeElement.querySelector("h2");
    expect(header).toBeNull();
  });

  it("should render the done summary after generation completes", async () => {
    mockPdfGeneratorApiService.generatePdfFromTemplate.mockReturnValue(
      of({ filename: "x.pdf", file: new ArrayBuffer(4) }),
    );
    component.templateSelectionForm.setValue("template-1");

    await component.requestFile();
    fixture.detectChanges();

    expect(component.phase()).toBe("done");
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="template-export-summary"]',
      ),
    ).not.toBeNull();
  });

  it("should list failed entity names in the done summary", async () => {
    const entityA = new TestEntity("a");
    entityA.name = "Anna";
    const entityB = new TestEntity("b");
    entityB.name = "Ben";

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        TemplateExportSelectionDialogComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: [entityA, entityB] },
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
            load: vi.fn(),
            loadType: vi.fn().mockResolvedValue([]),
            receiveUpdates: vi.fn().mockReturnValue(EMPTY),
          },
        },
        { provide: ActivatedRoute, useValue: null },
        { provide: AlertService, useValue: { addWarning: vi.fn() } },
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: TemplateExportService,
          useValue: mockTemplateExportService,
        },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
      ],
    }).compileComponents();

    const bulkFixture = TestBed.createComponent(
      TemplateExportSelectionDialogComponent,
    );
    bulkFixture.detectChanges();
    await bulkFixture.whenStable();
    const bulkComponent = bulkFixture.componentInstance;

    mockPdfGeneratorApiService.generateBatchFromTemplate.mockReturnValue(
      of({
        filename: "report.zip",
        file: new ArrayBuffer(8),
        failedIndices: [1],
      } as TemplateExportBatchResult),
    );
    bulkComponent.templateSelectionForm.setValue("template-1");

    await bulkComponent.requestFile();
    bulkFixture.detectChanges();

    const summary = bulkFixture.nativeElement.querySelector(
      '[data-testid="template-export-summary"]',
    );
    expect(summary).not.toBeNull();
    expect(summary.textContent).toContain("Ben");
    expect(bulkComponent.failures().length).toBe(1);
    expect(bulkComponent.failures()[0].entity).toBe(entityB);
  });

  it("should skip the download and end in cancelled phase when cancel is requested during a bulk run", async () => {
    const entityA = new TestEntity("a");
    const entityB = new TestEntity("b");

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        TemplateExportSelectionDialogComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: [entityA, entityB] },
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
            load: vi.fn(),
            loadType: vi.fn().mockResolvedValue([]),
            receiveUpdates: vi.fn().mockReturnValue(EMPTY),
          },
        },
        { provide: ActivatedRoute, useValue: null },
        { provide: AlertService, useValue: { addWarning: vi.fn() } },
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: TemplateExportService,
          useValue: mockTemplateExportService,
        },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
      ],
    }).compileComponents();

    const bulkFixture = TestBed.createComponent(
      TemplateExportSelectionDialogComponent,
    );
    bulkFixture.detectChanges();
    await bulkFixture.whenStable();
    const bulkComponent = bulkFixture.componentInstance;

    const deferred = new Subject<TemplateExportBatchResult>();
    mockPdfGeneratorApiService.generateBatchFromTemplate.mockReturnValue(
      deferred.asObservable(),
    );
    bulkComponent.templateSelectionForm.setValue("template-1");

    const inFlight = bulkComponent.requestFile();
    // user clicks cancel while the request is still pending
    bulkComponent.cancel();
    // the request eventually resolves, but the result must be discarded
    deferred.next({
      filename: "report.zip",
      file: new ArrayBuffer(4),
      failedIndices: [],
    });
    deferred.complete();
    await inFlight;

    expect(mockDownloadService.triggerDownload).not.toHaveBeenCalled();
    expect(bulkComponent.phase()).toBe("cancelled");
    expect(bulkComponent.cancelRequested()).toBe(true);
  });

  it("should warn and skip the API when invoked with an empty entity array", async () => {
    let warned = false;
    const warningAlertService = {
      addWarning: vi.fn(() => {
        warned = true;
      }),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        TemplateExportSelectionDialogComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: [] },
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
            load: vi.fn(),
            loadType: vi.fn().mockResolvedValue([]),
            receiveUpdates: vi.fn().mockReturnValue(EMPTY),
          },
        },
        { provide: ActivatedRoute, useValue: null },
        { provide: AlertService, useValue: warningAlertService },
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: TemplateExportService,
          useValue: mockTemplateExportService,
        },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
      ],
    }).compileComponents();

    const emptyFixture = TestBed.createComponent(
      TemplateExportSelectionDialogComponent,
    );
    emptyFixture.detectChanges();
    await emptyFixture.whenStable();

    emptyFixture.componentInstance.templateSelectionForm.setValue("template-1");
    await emptyFixture.componentInstance.requestFile();

    expect(warned).toBe(true);
    expect(
      mockPdfGeneratorApiService.generatePdfFromTemplate,
    ).not.toHaveBeenCalled();
    expect(
      mockPdfGeneratorApiService.generateBatchFromTemplate,
    ).not.toHaveBeenCalled();
  });
});
