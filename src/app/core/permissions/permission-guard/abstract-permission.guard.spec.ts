import { TestBed } from "@angular/core/testing";
import { Router, Routes } from "@angular/router";
import { AbstractPermissionGuard } from "./abstract-permission.guard";
import { Injectable, inject as inject_1 } from "@angular/core";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";

@Injectable()
class TestPermissionGuard extends AbstractPermissionGuard {
  constructor() {
    const router = inject_1(Router);

    super(router);
  }

  protected async canAccessRoute(
    routeData: DynamicComponentConfig,
  ): Promise<boolean> {
    return routeData?.config;
  }
}

describe("EntityPermissionGuard", () => {
  let guard: TestPermissionGuard;

  let testRoutes: Routes;

  beforeEach(() => {
    testRoutes = [{ path: "**", data: { config: true } }];

    TestBed.configureTestingModule({
      providers: [
        TestPermissionGuard,
        { provide: Router, useValue: { config: testRoutes } },
      ],
    });
    guard = TestBed.inject(TestPermissionGuard);
  });

  it("should be created", () => {
    expect(guard).toBeTruthy();
  });

  it("should get route config also for '**' path", async () => {
    const result = await guard.checkRoutePermissions("url");

    expect(result).toBeTrue();
  });
});
