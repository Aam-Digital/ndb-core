import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { ImportHistoryComponent } from "./import-history.component";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { ImportService } from "../import.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { of } from "rxjs";
import { ImportMetadata } from "../import-metadata";

describe("ImportHistoryComponent", () => {
  let component: ImportHistoryComponent;
  let fixture: ComponentFixture<ImportHistoryComponent>;

  let mockImportService: jasmine.SpyObj<ImportService>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockConfirmationDialogService: jasmine.SpyObj<ConfirmationDialogService>;

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
    mockImportService = jasmine.createSpyObj(["executeImport", "undoImport"]);
    mockEntityMapper = jasmine.createSpyObj(["receiveUpdates", "loadType"]);
    mockEntityMapper.loadType.and.resolveTo([]);
    mockEntityMapper.receiveUpdates.and.returnValue(of());
    mockConfirmationDialogService = jasmine.createSpyObj(["getConfirmation"]);

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

  it("should load all previous imports, sorted by date", fakeAsync(() => {
    mockEntityMapper.loadType.and.resolveTo([testImport1, testImport2]);

    component.ngOnInit();
    tick();

    expect(component.previousImports).toEqual([testImport2, testImport1]);
  }));

  it("should ask for confirmation before undo action", fakeAsync(() => {
    mockConfirmationDialogService.getConfirmation.and.resolveTo(false);
    component.undoImport(testImport1);
    tick();

    expect(mockConfirmationDialogService.getConfirmation).toHaveBeenCalled();
    expect(mockImportService.undoImport).not.toHaveBeenCalled();

    mockConfirmationDialogService.getConfirmation.and.resolveTo(true);
    component.undoImport(testImport1);
    tick();

    expect(mockConfirmationDialogService.getConfirmation).toHaveBeenCalled();
    expect(mockImportService.undoImport).toHaveBeenCalled();
  }));
});
