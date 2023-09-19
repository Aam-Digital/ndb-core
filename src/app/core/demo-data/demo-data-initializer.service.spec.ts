import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { DemoDataInitializerService } from "./demo-data-initializer.service";
import { DemoDataService } from "./demo-data.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { MatDialog } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./demo-data-generating-progress-dialog.component";
import { SessionType } from "../session/session-type";
import { environment } from "../../../environments/environment";
import { AuthUser } from "../session/auth/auth-user";
import { LocalAuthService } from "../session/auth/local/local-auth.service";
import { SessionManagerService } from "../session/session-service/session-manager.service";

describe("DemoDataInitializerService", () => {
  let service: DemoDataInitializerService;
  let mockDemoDataService: jasmine.SpyObj<DemoDataService>;
  let mockLocalAuth: jasmine.SpyObj<LocalAuthService>;
  let sessionManager: jasmine.SpyObj<SessionManagerService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    environment.session_type = SessionType.mock;
    mockDemoDataService = jasmine.createSpyObj(["publishDemoData"]);
    mockDemoDataService.publishDemoData.and.resolveTo();
    mockDialog = jasmine.createSpyObj(["open"]);
    mockDialog.open.and.returnValue({ close: () => {} } as any);
    mockLocalAuth = jasmine.createSpyObj(["saveUser"]);
    sessionManager = jasmine.createSpyObj(["offlineLogin"]);

    TestBed.configureTestingModule({
      providers: [
        DemoDataInitializerService,
        { provide: MatDialog, useValue: mockDialog },
        { provide: DemoDataService, useValue: mockDemoDataService },
        { provide: LocalAuthService, useValue: mockLocalAuth },
        { provide: SessionManagerService, useValue: sessionManager },
      ],
    });
    service = TestBed.inject(DemoDataInitializerService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should save the default users", () => {
    service.run();

    const normalUser: AuthUser = {
      name: DemoUserGeneratorService.DEFAULT_USERNAME,
      roles: ["user_app"],
    };

    expect(mockLocalAuth.saveUser).toHaveBeenCalledWith(normalUser);
  });

  it("it should publish the demo data after logging in the default user", async () => {
    await service.run();

    expect(sessionManager.offlineLogin).toHaveBeenCalled();
    expect(mockDemoDataService.publishDemoData).toHaveBeenCalled();
  });

  it("should show a dialog while generating demo data", fakeAsync(() => {
    const closeSpy = jasmine.createSpy();
    mockDialog.open.and.returnValue({ close: closeSpy } as any);
    service.run();

    expect(mockDialog.open).toHaveBeenCalledWith(
      DemoDataGeneratingProgressDialogComponent,
    );
    expect(closeSpy).not.toHaveBeenCalled();

    tick();

    expect(closeSpy).toHaveBeenCalled();
  }));
});
