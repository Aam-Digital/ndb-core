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
import { ConfigService } from "../../config/config.service";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { SessionType } from "../../session/session-type";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { environment } from "../../../../environments/environment";

describe("AdminComponent", () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  const mockBackupService = jasmine.createSpyObj<BackupService>([
    "getJsonExport",
    "getCsvExport",
    "clearDatabase",
    "importJson",
  ]);

  const confirmationDialogMock =
    jasmine.createSpyObj<ConfirmationDialogService>(["getConfirmation"]);

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

  beforeEach(waitForAsync(() => {
    environment.session_type = SessionType.mock;

    TestBed.configureTestingModule({
      imports: [AdminComponent, MockedTestingModule.withState()],
      providers: [
        { provide: BackupService, useValue: mockBackupService },
        {
          provide: ConfirmationDialogService,
          useValue: confirmationDialogMock,
        },
      ],
    }).compileComponents();
  }));

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
    mockBackupService.getJsonExport.and.resolveTo("");
    component.saveBackup();
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(tmplink.click).toHaveBeenCalled();
  }));

  it("should call backup service for csv export", fakeAsync(() => {
    spyOn(document, "createElement").and.returnValue(tmplink);
    mockBackupService.getCsvExport.and.resolveTo("");
    component.saveCsvExport();
    expect(mockBackupService.getCsvExport).toHaveBeenCalled();
    tick();
    expect(tmplink.click).toHaveBeenCalled();
  }));

  it("should call config service for configuration export", fakeAsync(() => {
    spyOn(document, "createElement").and.returnValue(tmplink);
    const exportConfigSpy = spyOn(
      TestBed.inject(ConfigService),
      "exportConfig"
    );

    component.downloadConfigClick();
    expect(exportConfigSpy).toHaveBeenCalled();
    tick();
    expect(tmplink.click).toHaveBeenCalled();
  }));

  it("should save and apply new configuration", fakeAsync(() => {
    const mockFileReader = createFileReaderMock("{}");
    const saveConfigSpy = spyOn(TestBed.inject(ConfigService), "saveConfig");
    saveConfigSpy.and.resolveTo(null);
    component.uploadConfigFile({ target: { files: [] } } as any);
    tick();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(saveConfigSpy).toHaveBeenCalled();
  }));

  it("should open dialog and call backup service when loading backup", fakeAsync(() => {
    const mockFileReader = createFileReaderMock("[]");
    mockBackupService.getJsonExport.and.resolveTo("[]");
    confirmationDialogMock.getConfirmation.and.resolveTo(true);

    component.loadBackup({ target: { files: [] } } as any);
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(mockFileReader.readAsText).toHaveBeenCalled();
    expect(confirmationDialogMock.getConfirmation).toHaveBeenCalled();
    flush();
    expect(mockBackupService.clearDatabase).toHaveBeenCalled();
    expect(mockBackupService.importJson).toHaveBeenCalled();
  }));

  it("should open dialog when clearing database", fakeAsync(() => {
    mockBackupService.getJsonExport.and.resolveTo("");
    confirmationDialogMock.getConfirmation.and.resolveTo(true);

    component.clearDatabase();
    expect(mockBackupService.getJsonExport).toHaveBeenCalled();
    tick();
    expect(confirmationDialogMock.getConfirmation).toHaveBeenCalled();
    flush();
    expect(mockBackupService.clearDatabase).toHaveBeenCalled();
  }));
});
