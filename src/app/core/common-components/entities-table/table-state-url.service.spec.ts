import { TestBed } from "@angular/core/testing";
import { Router, ActivatedRoute } from "@angular/router";
import { TableStateUrlService } from "./table-state-url.service";
import type { Mock } from "vitest";

type RouterMock = {
  navigate: Mock;
  createUrlTree: Mock;
};

type UrlTreeLike = {
  root: object;
  queryParams: Record<string, string>;
  fragment: string | null;
  queryParamMap: null;
  toString: () => string;
};

type QueryParamMapMock = {
  get: (key: string) => string | null;
};

type ActivatedRouteSnapshotStub = {
  queryParams: Record<string, string>;
  readonly queryParamMap: QueryParamMapMock;
};

describe("TableStateUrlService", () => {
  let service: TableStateUrlService;
  let routerSpy: RouterMock;
  let activatedRouteStub: { snapshot: ActivatedRouteSnapshotStub };
  let queryParamMapMock: QueryParamMapMock;

  beforeEach(() => {
    routerSpy = {
      navigate: vi.fn().mockName("Router.navigate"),
      createUrlTree: vi.fn().mockName("Router.createUrlTree"),
    };
    // Default: createUrlTree returns a minimal UrlTree-like object
    routerSpy.createUrlTree.mockReturnValue({
      root: {},
      queryParams: {},
      fragment: null,
      queryParamMap: null,
      toString: () => "/?foo=bar",
    } satisfies UrlTreeLike);
    queryParamMapMock = { get: (_: string) => null };
    activatedRouteStub = {
      snapshot: {
        queryParams: {},
        get queryParamMap() {
          return queryParamMapMock;
        },
      },
    };

    TestBed.configureTestingModule({
      providers: [
        TableStateUrlService,
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: activatedRouteStub as ActivatedRoute,
        },
      ],
    });
    service = TestBed.inject(TableStateUrlService);
  });

  it("should add/update query params and call router.navigate", () => {
    activatedRouteStub.snapshot.queryParams = { foo: "bar" };
    service.updateUrlParams({ foo: "baz", newParam: "val" });
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { foo: "baz", newParam: "val" },
        replaceUrl: true,
      }),
    );
  });

  it("should remove param if value is null or empty", () => {
    activatedRouteStub.snapshot.queryParams = { foo: "bar", removeMe: "gone" };
    service.updateUrlParams({ removeMe: null });
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { foo: "bar" },
      }),
    );
  });

  it("should return the value from queryParamMap", () => {
    queryParamMapMock.get = (key: string) => (key === "foo" ? "bar" : null);
    expect(service.getUrlParam("foo")).toBe("bar");
    expect(service.getUrlParam("notfound")).toBeNull();
  });

  it("should return all query params", () => {
    activatedRouteStub.snapshot.queryParams = { foo: "bar", baz: "qux" };
    expect(service.getAllUrlParams()).toEqual({ foo: "bar", baz: "qux" });
  });

  it("should call updateUrlParams with replaceUrl false for updateFilterParam", () => {
    vi.spyOn(service, "updateUrlParams");
    service.updateFilterParam("filter", "val");
    expect(service.updateUrlParams).toHaveBeenCalledWith(
      { filter: "val" },
      false,
    );
  });

  it("should exclude sortBy and sortOrder in getFilterParams", () => {
    activatedRouteStub.snapshot.queryParams = {
      foo: "bar",
      sortBy: "name",
      sortOrder: "asc",
      filter: "val",
    };
    expect(service.getFilterParams()).toEqual({ foo: "bar", filter: "val" });
  });

  it("should remove specified filter keys and call router.navigate in clearFilterParams", () => {
    activatedRouteStub.snapshot.queryParams = {
      foo: "bar",
      filter1: "a",
      filter2: "b",
    };
    service.clearFilterParams(["filter1", "filter2"]);
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { foo: "bar" },
      }),
    );
  });

  it("should remove the longest filter option if URL length exceeds maximum", () => {
    // Simulate a very long filter value and a short one
    const longValue = "x".repeat(2100); // longer than MAX_URL_LENGTH
    const shortValue = "y";
    activatedRouteStub.snapshot.queryParams = {
      filter1: longValue,
      filter2: shortValue,
    };
    // Use .and.callFake on the existing spy
    routerSpy.createUrlTree.mockImplementation((_, opts) => {
      const params = opts?.queryParams || {};
      // If the long param is present, return a long string
      if (params["filter1"]) {
        return {
          root: {},
          queryParams: params,
          fragment: null,
          queryParamMap: null,
          toString: () => "/?filter1=" + longValue + "&filter2=" + shortValue,
        } satisfies UrlTreeLike;
      }
      // If the long param is removed, return a short string
      return {
        root: {},
        queryParams: params,
        fragment: null,
        queryParamMap: null,
        toString: () => "/?filter2=" + shortValue,
      } satisfies UrlTreeLike;
    });
    service.updateUrlParams({ filter1: longValue, filter2: shortValue });
    // Should call router.navigate with only the short param left
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { filter2: shortValue },
        replaceUrl: true,
      }),
    );
  });
});
