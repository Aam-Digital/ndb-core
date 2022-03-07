import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { DemoDataInitializerService } from "./demo-data-initializer.service";
import { DemoDataService } from "./demo-data.service";
import { SessionService } from "../session/session-service/session.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { LocalSession } from "../session/session-service/local-session";
import { DatabaseUser } from "../session/session-service/local-user";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./demo-data-generating-progress-dialog.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("DemoDataInitializerService", () => {
  let service: DemoDataInitializerService;
  let mockDemoDataService: jasmine.SpyObj<DemoDataService>;
  let mockSessionService: jasmine.SpyObj<LocalSession>;
  beforeEach(() => {
    mockDemoDataService = jasmine.createSpyObj(["publishDemoData"]);
    mockDemoDataService.publishDemoData.and.resolveTo();
    mockSessionService = jasmine.createSpyObj(["login", "saveUser"]);
    // @ts-ignore this makes the spy pass the instanceof check
    mockSessionService.__proto__ = LocalSession.prototype;

    TestBed.configureTestingModule({
      imports: [MatDialogModule, NoopAnimationsModule],
      providers: [
        { provide: DemoDataService, useValue: mockDemoDataService },
        { provide: SessionService, useValue: mockSessionService },
      ],
    });
    service = TestBed.inject(DemoDataInitializerService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should save the default users", () => {
    const normalUser: DatabaseUser = {
      name: DemoUserGeneratorService.DEFAULT_USERNAME,
      roles: ["user_app"],
    };
    const adminUser: DatabaseUser = {
      name: DemoUserGeneratorService.ADMIN_USERNAME,
      roles: ["user_app", "admin_app"],
    };

    expect(mockSessionService.saveUser).toHaveBeenCalledWith(
      normalUser,
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
    expect(mockSessionService.saveUser).toHaveBeenCalledWith(
      adminUser,
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
  });

  it("it should login the default user after publishing the demo data", fakeAsync(() => {
    service.run();

    expect(mockDemoDataService.publishDemoData).toHaveBeenCalled();
    expect(mockSessionService.login).not.toHaveBeenCalled();

    tick();

    expect(mockSessionService.login).toHaveBeenCalledWith(
      DemoUserGeneratorService.DEFAULT_USERNAME,
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
  }));

  it("should show a dialog while generating demo data", fakeAsync(() => {
    const dialog = TestBed.inject(MatDialog);
    const closeSpy = jasmine.createSpy();
    spyOn(dialog, "open").and.returnValue({ close: closeSpy } as any);
    service.run();

    expect(dialog.open).toHaveBeenCalledWith(
      DemoDataGeneratingProgressDialogComponent
    );
    expect(closeSpy).not.toHaveBeenCalled();

    tick();

    expect(closeSpy).toHaveBeenCalled();
  }));
});
