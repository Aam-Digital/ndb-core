import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportHistoryComponent } from "./import-history.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { ImportService } from "../import.service";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { of } from "rxjs";
import { ImportModule } from "../import.module";

describe("ImportHistoryComponent", () => {
  let component: ImportHistoryComponent;
  let fixture: ComponentFixture<ImportHistoryComponent>;

  let mockImportService: jasmine.SpyObj<ImportService>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockConfirmationDialogService: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(async () => {
    mockImportService = jasmine.createSpyObj(["executeImport", "undoImport"]);
    mockEntityMapper = jasmine.createSpyObj(["receiveUpdates", "loadType"]);
    mockEntityMapper.receiveUpdates.and.returnValue(of());
    mockConfirmationDialogService = jasmine.createSpyObj(["getConfirmation"]);

    await TestBed.configureTestingModule({
      imports: [ImportModule],
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

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
