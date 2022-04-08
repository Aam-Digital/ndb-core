import { TestBed } from "@angular/core/testing";
import { PwaInstallModule } from "./pwa-install.module";

import { PwaInstallService, PWAInstallType } from "./pwa-install.service";
import { WINDOW_TOKEN } from "../utils/di-tokens";

describe("PwaInstallService", () => {
  let service: PwaInstallService;
  let mockWindow;

  beforeEach(() => {
    mockWindow = {
      navigator: {
        userAgent: "mockAgent",
      },
      addEventListener: () => {},
      innerWidth: 2000,
      matchMedia: () => ({}),
    };
    TestBed.configureTestingModule({
      imports: [PwaInstallModule],
      providers: [{ provide: WINDOW_TOKEN, useValue: mockWindow }],
    });
    service = TestBed.inject(PwaInstallService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return install instructions for IOS devices on safari", () => {
    mockWindow.navigator.userAgent = "iphone safari";
    mockWindow.innerWidth = 1000;

    const installType = service.getPWAInstallType();
    expect(installType).toBe(PWAInstallType.ShowiOSInstallInstructions);
  });

  it("should detect standalone mode", () => {
    spyOn(mockWindow, "matchMedia").and.returnValue({ matches: true } as any);
    expect(service.getPWAInstallType()).toBe(PWAInstallType.RunningAsPWA);
  });

  it("should return not available install type for other browsers/devices", () => {
    mockWindow.navigator.userAgent = "firefox windows";
    expect(service.getPWAInstallType()).toBe(PWAInstallType.NotAvailable);
  });

  it("should execute install event when calling install", async () => {
    const installSpy = jasmine.createSpy();
    spyOn(mockWindow, "addEventListener").and.callFake((_, callback) =>
      callback({
        prompt: installSpy,
        preventDefault: () => {},
        userChoice: Promise.resolve({ outcome: "accepted" }),
      })
    );

    service.registerPWAInstallListener();
    expect(mockWindow.addEventListener).toHaveBeenCalledWith(
      "beforeinstallprompt",
      jasmine.anything()
    );
    await expectAsync(service.canInstallDirectly).toBeResolved();

    const installPromise = service.installPWA();
    expect(installSpy).toHaveBeenCalled();
    await expectAsync(installPromise).toBeResolvedTo({ outcome: "accepted" });
  });

  it("should throw an error when trying to install without install prompt", () => {
    expect(service.installPWA).toThrowError();
  });
});
