import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { AdminComponent } from "./admin.component";
import { BackupService } from "../services/backup.service";
import { AppConfig } from "../../app-config/app-config";
import { ConfigService } from "../../config/config.service";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { of } from "rxjs";
import { MatDialogRef } from "@angular/material/dialog";
import { SessionType } from "../../session/session-type";
import { AdminModule } from "../admin.module";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("AdminComponent", () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  const mockConfigService: jasmine.SpyObj<ConfigService> = jasmine.createSpyObj(
    ConfigService,
    ["exportConfig", "saveConfig", "loadConfig"]
  );
  const mockBackupService: jasmine.SpyObj<BackupService> = jasmine.createSpyObj(
    BackupService,
    ["getJsonExport", "getCsvExport", "clearDatabase", "importJson"]
  );

  const confirmationDialogMock: jasmine.SpyObj<ConfirmationDialogService> = jasmine.createSpyObj(
    ConfirmationDialogService,
    ["openDialog"]
  );

  const tmplink: jasmine.SpyObj<HTMLAnchorElement> = jasmine.createSpyObj(
    "mockLink",
    ["click"],
    ["href", "target", "download"]
  );

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

  function createDialogMock(): jasmine.SpyObj<MatDialogRef<any>> {
    const mockDialogRef: jasmine.SpyObj<
      MatDialogRef<any>
    > = jasmine.createSpyObj("mockDialogRef", ["afterClosed"]);
    mockDialogRef.afterClosed.and.returnValue(of(true));
    confirmationDialogMock.openDialog.and.returnValue(mockDialogRef);
    return mockDialogRef;
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
        imports: [AdminModule, MockedTestingModule.withState()],
        providers: [
          { provide: BackupService, useValue: mockBackupService },
          { provide: ConfigService, useValue: mockConfigService },
          {
            provide: ConfirmationDialogService,
            useValue: confirmationDialogMock,
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call backup service for json export", fakeAsync(() => {
    spyOn(document, "createElement").and.callFake(() => tmplink);
    mockBackupService.getJsonExport.and.returnValue(Promise.resolve(""));
    component.saveBackup();
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(tmplink.click).toHaveBeenCalled();
  }));

  it("should call backup service for csv export", fakeAsync(() => {
    spyOn(document, "createElement").and.returnValue(tmplink);
    mockBackupService.getCsvExport.and.returnValue(Promise.resolve(""));
    component.saveCsvExport();
    expect(mockBackupService.getCsvExport).toHaveBeenCalled();
    tick();
    expect(tmplink.click).toHaveBeenCalled();
  }));

  it("should call config service for configuration export", fakeAsync(() => {
    spyOn(document, "createElement").and.returnValue(tmplink);
    component.downloadConfigClick();
    expect(mockConfigService.exportConfig).toHaveBeenCalled();
    tick();
    expect(tmplink.click).toHaveBeenCalled();
  }));

  it("should save and apply new configuration", fakeAsync(() => {
    const mockFileReader = createFileReaderMock("{}");
    mockConfigService.saveConfig.and.returnValue(Promise.resolve(null));
    component.uploadConfigFile({ target: { files: [] } } as any);
    tick();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(mockConfigService.saveConfig).toHaveBeenCalled();
  }));

  it("should open dialog and call backup service when loading backup", fakeAsync(() => {
    const mockFileReader = createFileReaderMock("[]");
    mockBackupService.getJsonExport.and.returnValue(Promise.resolve("[]"));
    createDialogMock();

    component.loadBackup({ target: { files: [] } } as any);
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(confirmationDialogMock.openDialog).toHaveBeenCalled();
    flush();
    expect(mockBackupService.clearDatabase).toHaveBeenCalled();
    expect(mockBackupService.importJson).toHaveBeenCalled();
  }));

  it("should open dialog when clearing database", fakeAsync(() => {
    mockBackupService.getJsonExport.and.returnValue(Promise.resolve(""));
    createDialogMock();

    component.clearDatabase();
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(confirmationDialogMock.openDialog).toHaveBeenCalled();
    flush();
    expect(mockBackupService.clearDatabase).toHaveBeenCalled();
  }));
});
