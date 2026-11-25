import { TestBed } from "@angular/core/testing";

import { PwaInstallService } from "./pwa-install.service";
import { WINDOW_TOKEN } from "../../utils/di-tokens";
import {
  registerPWAInstallListener,
  resetPWAInstallListener,
} from "#src/bootstrap-pwa-install";

const IOS_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IOS_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1";
const IOS_FIREFOX =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/131.0 Mobile/15E148 Safari/605.1.15";
const IOS_EDGE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 EdgiOS/130.0.2849.80 Mobile/15E148 Safari/605.1.15";
const IOS_IN_APP =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
const IPAD_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const MAC_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const WINDOWS_FIREFOX =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0";

describe("PwaInstallService", () => {
  let service: PwaInstallService;
  let mockWindow;

  beforeEach(() => {
    mockWindow = {
      navigator: {
        userAgent: "mockAgent",
      },
      matchMedia: () => ({}),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: WINDOW_TOKEN, useValue: mockWindow }],
    });
    service = TestBed.inject(PwaInstallService);
  });

  afterEach(() => {
    // module-level state is shared with every other spec in this worker
    resetPWAInstallListener();
  });

  it.each([
    ["Safari on iOS", IOS_SAFARI, 5, true],
    ["Chrome on iOS", IOS_CHROME, 5, true],
    ["Firefox on iOS", IOS_FIREFOX, 5, true],
    ["Edge on iOS", IOS_EDGE, 5, true],
    ["Safari on iPadOS (reports a Mac user agent)", IPAD_SAFARI, 5, true],
    ["an in-app browser on iOS", IOS_IN_APP, 5, false],
    ["Chrome on Android", ANDROID_CHROME, 5, false],
    ["Chrome on macOS", MAC_CHROME, 0, false],
    ["Firefox on Windows", WINDOWS_FIREFOX, 0, false],
  ])(
    "offers the install instructions only in real browsers on iOS (%s)",
    (_, userAgent, touchPoints, expected) => {
      mockWindow.navigator.userAgent = userAgent;
      mockWindow.navigator.maxTouchPoints = touchPoints;

      expect(service.showIOSInstallInstructions()).toBe(expected);
    },
  );

  it("should not show the iOS install instructions inside the installed app", () => {
    mockWindow.navigator.userAgent = IOS_SAFARI;
    vi.spyOn(mockWindow, "matchMedia").mockReturnValue({
      matches: true,
    } as any);
    expect(service.showIOSInstallInstructions()).toBe(false);
  });

  it("should execute install event when calling install", async () => {
    const installSpy = vi.fn();
    vi.spyOn(window, "addEventListener").mockImplementation((_, callback) => {
      (callback as EventListener)({
        prompt: installSpy,
        preventDefault: () => {},
        userChoice: Promise.resolve({ outcome: "accepted" }),
      } as any);
    });

    registerPWAInstallListener();
    expect(window.addEventListener).toHaveBeenCalledWith(
      "beforeinstallprompt",
      expect.anything(),
    );
    await expect(service.canInstallDirectly).resolves.toBeUndefined();

    const installPromise = service.installPWA();
    expect(installSpy).toHaveBeenCalled();
    await expect(installPromise).resolves.toEqual({ outcome: "accepted" });
  });

  it("should throw an error when trying to install without install prompt", () => {
    expect(() => service.installPWA()).toThrowError();
  });
});
