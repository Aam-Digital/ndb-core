import { TestBed } from "@angular/core/testing";
import type { Mock } from "vitest";
import { FirebaseMessagingServiceWorker } from "./firebase-messaging-service-worker";
import { NAVIGATOR_TOKEN } from "../../utils/di-tokens";
import { environment } from "../../../environments/environment";
import { FirebaseConfiguration } from "./notification-config.interface";

describe("FirebaseMessagingServiceWorker", () => {
  let service: FirebaseMessagingServiceWorker;
  let register: Mock;
  let originalConfig: FirebaseConfiguration;

  const config = {
    apiKey: "test-api-key",
    projectId: "test-project",
  } as FirebaseConfiguration;

  function installingWorker() {
    const worker = new EventTarget() as ServiceWorker & { state: string };
    worker.state = "installing";
    return worker;
  }

  /** let the registration reach the point where it waits for the worker */
  const flush = () => new Promise((resolve) => setTimeout(resolve));

  function changeState(worker: ServiceWorker, state: ServiceWorkerState) {
    (worker as { state: string }).state = state;
    worker.dispatchEvent(new Event("statechange"));
  }

  beforeEach(() => {
    originalConfig = environment.notificationsConfig;
    environment.notificationsConfig = config;
    register = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: NAVIGATOR_TOKEN, useValue: { serviceWorker: { register } } },
      ],
    });
    service = TestBed.inject(FirebaseMessagingServiceWorker);
  });

  afterEach(() => {
    environment.notificationsConfig = originalConfig;
  });

  it("passes the Firebase config in the script URL and keeps the Firebase default scope", async () => {
    const registration = { active: {} } as ServiceWorkerRegistration;
    register.mockResolvedValue(registration);

    await expect(service.register()).resolves.toBe(registration);

    expect(register).toHaveBeenCalledWith(
      "/firebase-messaging-sw.js?apiKey=test-api-key&projectId=test-project",
      { scope: "/firebase-cloud-messaging-push-scope" },
    );
  });

  it("resolves only once a newly installed service worker is activated", async () => {
    const worker = installingWorker();
    register.mockResolvedValue({ installing: worker, active: null });

    let resolved = false;
    const result = service.register().then(() => (resolved = true));
    await flush();
    changeState(worker, "installed");
    await flush();
    expect(resolved).toBe(false);

    changeState(worker, "activated");
    await result;
    expect(resolved).toBe(true);
  });

  it("rejects if the service worker cannot be installed", async () => {
    const worker = installingWorker();
    register.mockResolvedValue({ installing: worker, active: null });

    const result = service.register();
    await flush();
    changeState(worker, "redundant");

    await expect(result).rejects.toThrow();
  });

  it("does not register a service worker without a Firebase config", async () => {
    environment.notificationsConfig = undefined;

    await expect(service.register()).rejects.toThrow();
    expect(register).not.toHaveBeenCalled();
  });
});
