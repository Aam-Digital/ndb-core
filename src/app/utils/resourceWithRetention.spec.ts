import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { resourceWithRetention } from "./resourceWithRetention";

describe("resourceWithRetention", () => {
  it("retains previous value during loading", async () => {
    const resolvers: Array<(value: string) => void> = [];

    const params = signal("initial");
    const resource = TestBed.runInInjectionContext(() =>
      resourceWithRetention({
        params,
        loader: () => {
          return new Promise<string>((resolve) => {
            resolvers.push(resolve);
          });
        },
      }),
    );
    await Promise.resolve();
    expect(resource.value()).toBe(undefined);
    expect(resource.isLoading()).toBe(true);
    expect(resource.status()).toBe("loading");

    await vi.waitFor(() => expect(resolvers).toHaveLength(1));
    resolvers[0]("first-value");
    await vi.waitFor(() => expect(resource.status()).toBe("resolved"));
    expect(resource.value()).toBe("first-value");
    expect(resource.isLoading()).toBe(false);
    expect(resource.status()).toBe("resolved");

    params.set("updated");
    await Promise.resolve();
    expect(resource.value()).toBe("first-value");
    expect(resource.isLoading()).toBe(true);
    expect(resource.status()).toBe("loading");

    await vi.waitFor(() => expect(resolvers).toHaveLength(2));
    resolvers[1]("second-value");
    await vi.waitFor(() => expect(resource.status()).toBe("resolved"));
    expect(resource.value()).toBe("second-value");
    expect(resource.isLoading()).toBe(false);
    expect(resource.status()).toBe("resolved");
  });
});
