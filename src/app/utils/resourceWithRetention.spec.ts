import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { signal } from "@angular/core";
import { resourceWithRetention } from "./resourceWithRetention";

describe("resourceWithRetention", () => {
  it("retains previous value during loading", fakeAsync(() => {
    let resolvePromise: (value: string) => void;

    const params = signal("initial");
    const resource = TestBed.runInInjectionContext(() =>
      resourceWithRetention({
        params,
        loader: () => {
          return new Promise<string>((resolve) => {
            resolvePromise = resolve;
          });
        },
      }),
    );
    tick();
    expect(resource.value()).toBe(undefined);
    expect(resource.isLoading()).toBe(true);
    expect(resource.status()).toBe("loading");

    resolvePromise("first-value");
    tick();
    expect(resource.value()).toBe("first-value");
    expect(resource.isLoading()).toBe(false);
    expect(resource.status()).toBe("resolved");

    params.set("updated");
    tick();
    expect(resource.value()).toBe("first-value");
    expect(resource.isLoading()).toBe(true);
    expect(resource.status()).toBe("loading");

    resolvePromise("second-value");
    tick();
    expect(resource.value()).toBe("second-value");
    expect(resource.isLoading()).toBe(false);
    expect(resource.status()).toBe("resolved");
  }));
});
