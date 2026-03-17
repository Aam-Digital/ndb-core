import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportHistoryComponent } from "./import-history.component";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { ImportService } from "../import.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { of } from "rxjs";
import { ImportMetadata } from "../import-metadata";

describe("ImportHistoryComponent", () => {
  let component: ImportHistoryComponent;
  let fixture: ComponentFixture<ImportHistoryComponent>;

  let mockImportService: any;
  let mockEntityMapper: any;
  let mockConfirmationDialogService: any;

  const testImport1: ImportMetadata = ImportMetadata.create({
    config: null,
    createdEntities: ["1"],
    created: { at: new Date("2023-05-01"), by: null },
  });
  const testImport2: ImportMetadata = ImportMetadata.create({
    config: null,
    createdEntities: ["2"],
    created: { at: new Date("2023-05-30"), by: null },
  });

  beforeEach(async () => {
    mockImportService = {
      executeImport: vi.fn(),
      undoImport: vi.fn(),
    };
    mockEntityMapper = {
      receiveUpdates: vi.fn(),
      loadType: vi.fn(),
    };
    mockEntityMapper.loadType.mockResolvedValue([]);
    mockEntityMapper.receiveUpdates.mockReturnValue(of());
    mockConfirmationDialogService = {
      getConfirmation: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ImportHistoryComponent],
      providers: [
        { provide: ImportService, useValue: mockImportService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialogService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should load all previous imports, sorted by date", async () => {
    vi.useFakeTimers();
    try {
      mockEntityMapper.loadType.mockResolvedValue([testImport1, testImport2]);

      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.previousImports).toEqual([testImport2, testImport1]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should ask for confirmation before undo action", async () => {
    vi.useFakeTimers();
    try {
      mockConfirmationDialogService.getConfirmation.mockResolvedValue(false);
      component.undoImport(testImport1);
      await vi.advanceTimersByTimeAsync(0);

      expect(mockConfirmationDialogService.getConfirmation).toHaveBeenCalled();
      expect(mockImportService.undoImport).not.toHaveBeenCalled();

      mockConfirmationDialogService.getConfirmation.mockResolvedValue(true);
      component.undoImport(testImport1);
      await vi.advanceTimersByTimeAsync(0);

      expect(mockConfirmationDialogService.getConfirmation).toHaveBeenCalled();
      expect(mockImportService.undoImport).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
