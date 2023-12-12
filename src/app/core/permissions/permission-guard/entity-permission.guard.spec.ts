import { TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRouteSnapshot, Router } from "@angular/router";
import { EntityPermissionGuard } from "./entity-permission.guard";
import { EntityAbility } from "../ability/entity-ability";

describe("EntityPermissionGuard", () => {
  let guard: EntityPermissionGuard;
  let mockAbility: jasmine.SpyObj<EntityAbility>;

  beforeEach(() => {
    mockAbility = jasmine.createSpyObj(["can"]);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        EntityPermissionGuard,
        { provide: EntityAbility, useValue: mockAbility },
      ],
    });
    guard = TestBed.inject(EntityPermissionGuard);
  });

  it("should be created", () => {
    expect(guard).toBeTruthy();
  });

  it("should use ability to check if current user is allowed", () => {
    mockAbility.can.and.returnValue(true);

    const result = guard.canActivate({
      routeConfig: { path: "url" },
      data: {
        requiredPermissionOperation: "update",
        config: { entityType: "TestEntity" },
      },
    } as Partial<ActivatedRouteSnapshot> as ActivatedRouteSnapshot);

    expect(result).toBeTrue();
    expect(mockAbility.can).toHaveBeenCalledWith("update", "TestEntity");
  });

  it("should navigate to 404 for real navigation requests without permissions", () => {
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
    const route = new ActivatedRouteSnapshot();
    Object.assign(route, {
      routeConfig: { path: "url" },
      data: { requiredPermissionOperation: "update", entityType: "Child" },
    });
    mockAbility.can.and.returnValue(false);

    guard.canActivate(route);

    expect(router.navigate).toHaveBeenCalledWith(["/404"]);
  });

  it("should check 'read' permissions if only entity and no operation is set", () => {
    mockAbility.can.and.returnValue(true);
    const result = guard.canActivate({
      routeConfig: { path: "default-operation-config" },
      data: { entity: "Child" },
    } as Partial<ActivatedRouteSnapshot> as ActivatedRouteSnapshot);

    expect(result).toBeTrue();
    expect(mockAbility.can).toHaveBeenCalledWith("read", "Child");
  });

  it("should return true as default if no entity or operation are configured", () => {
    const result = guard.canActivate({
      routeConfig: { path: "no-permission-config" },
    } as any);

    expect(result).toBeTrue();
    expect(mockAbility.can).not.toHaveBeenCalled();
  });
});
