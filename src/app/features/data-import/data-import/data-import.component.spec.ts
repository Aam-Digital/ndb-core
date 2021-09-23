import { ComponentFixture, TestBed, waitForAsync} from "@angular/core/testing";
import { DataImportComponent } from "./data-import.component";
import { BackupService } from "../../../core/admin/services/backup.service";
import { MatDialogRef } from "@angular/material/dialog";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar, MatSnackBarModule, MatSnackBarRef } from "@angular/material/snack-bar";
import { MatButtonModule } from "@angular/material/button";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { AppConfig } from "../../../core/app-config/app-config";
import { SessionType } from "../../../core/session/session-type";
import { DataImportService } from "../data-import.service";
import {of} from "rxjs";
import {Database} from "../../../core/database/database";

describe("DataImportComponent", () => {
  let component: DataImportComponent;
  let fixture: ComponentFixture<DataImportComponent>;
  let db: Database;

  let mockDataImportService: jasmine.SpyObj<DataImportService>;
  let mockBackupService: jasmine.SpyObj<BackupService>
  let confirmationDialogMock: jasmine.SpyObj<ConfirmationDialogService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  function createFileReaderMock(result: string = "") {
    const mockFileReader: any = {
      result: result,
      addEventListener: (str: string, fun: () => any) => fun(),
      readAsText: () => {},
    };
    spyOn(mockFileReader, "readAsText");
    // mock FileReader constructor
    spyOn(window, "FileReader").and.returnValue(mockFileReader);
    return mockFileReader;
  }

  function createDialogMock(confirm: boolean): jasmine.SpyObj<MatDialogRef<any>> {
    const mockDialogRef: jasmine.SpyObj<
      MatDialogRef<any>
      > = jasmine.createSpyObj("mockDialogRef", ["afterClosed"]);
    mockDialogRef.afterClosed.and.returnValue(of(confirm));
    confirmationDialogMock.openDialog.and.returnValue(mockDialogRef);
    return mockDialogRef;
  }

  function createSnackBarMock(readable: boolean = false): jasmine.SpyObj<MatSnackBarRef<any>> {
    const mockSnackBarRef: jasmine.SpyObj<
      MatSnackBarRef<any>
      > = jasmine.createSpyObj("mockSnackBarRef", ["onAction"]);
    if (readable) {
      mockSnackBarRef.onAction.and.returnValue(of(null));
    } else {
      mockSnackBarRef.onAction.and.returnValue(of());
    }
    mockSnackBar.open.and.returnValue(mockSnackBarRef);
    return mockSnackBarRef;
  }

  beforeEach(
    waitForAsync(() => {
      AppConfig.settings = {
        site_name: "",
        session_type: SessionType.mock,
        database: {
          name: "unit-tests",
          remote_url: "",
        },
      };

      TestBed.configureTestingModule({
        imports: [
          MatSnackBarModule,
          MatButtonModule,
          NoopAnimationsModule,
        ],
        declarations: [DataImportComponent],
        providers: [
          { provide: DataImportService },
          {
            provide: BackupService,
            useValue: mockBackupService
          },
          { provide: AppConfig, useValue: { load: () => {} } },
          {
            provide: Database,
            useValue: db
          },
          {
            provide: ConfirmationDialogService,
            useValue: confirmationDialogMock,
          },
          {
            provide: MatSnackBar,
            useValue: mockSnackBar,
          }
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DataImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

});
