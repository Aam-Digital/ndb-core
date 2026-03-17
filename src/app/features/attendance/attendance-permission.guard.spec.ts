import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, Router, RouterModule } from "@angular/router";
import { AttendancePermissionGuard } from "./attendance-permission.guard";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import { AttendanceService } from "./attendance.service";
import { TestEventEntity } from "#src/app/utils/test-utils/TestEventEntity";
import { signal } from "@angular/core";

describe("AttendancePermissionGuard", () => {
  let guard: AttendancePermissionGuard;
  let mockAbility: jasmine.SpyObj<EntityAbility>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  const mockActivityType = { ENTITY_TYPE: "RecurringActivity" } as any;
  const mockEventType = TestEventEntity;

  beforeEach(() => {
    mockAbility = jasmine.createSpyObj(["can"], { initialized: true });
    mockAttendanceService = {
      eventTypeSettings: [],
      activityTypes: signal([mockActivityType]),
      eventTypes: signal([mockEventType]),
    } as any;

    TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      providers: [
        AttendancePermissionGuard,
        { provide: EntityAbility, useValue: mockAbility },
        { provide: AttendanceService, useValue: mockAttendanceService },
      ],
    });
    guard = TestBed.inject(AttendancePermissionGuard);
  });

  it("should be created", () => {
    expect(guard).toBeTruthy();
  });

  it("should complete without hanging when ability is not yet initialized and on('updated') fires immediately", async () => {
    const uninitializedAbility = {
      initialized: false,
      can: jasmine.createSpy("can").and.returnValue(true),
      on: (_event: string, cb: () => void) => cb(),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      providers: [
        AttendancePermissionGuard,
        { provide: EntityAbility, useValue: uninitializedAbility },
        { provide: AttendanceService, useValue: mockAttendanceService },
      ],
    });
    const guardWithEmptyRules = TestBed.inject(AttendancePermissionGuard);

    const result = await guardWithEmptyRules.canActivate({
      data: { component: "AttendanceManager" },
      params: {},
    } as Partial<ActivatedRouteSnapshot> as ActivatedRouteSnapshot);

    expect(result).toBeTrue();
  });

  it("should allow AttendanceManager if user can read a recurringActivityType", async () => {
    mockAbility.can.and.returnValue(true);

    const result = await guard.canActivate({
      data: { component: "AttendanceManager" },
      params: {},
    } as Partial<ActivatedRouteSnapshot> as ActivatedRouteSnapshot);

    expect(result).toBeTrue();
    expect(mockAbility.can).toHaveBeenCalledWith("read", mockActivityType);
  });

  it("should block AttendanceManager if user cannot read any recurringActivityType", async () => {
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
    mockAbility.can.and.returnValue(false);
    const route = new ActivatedRouteSnapshot();
    Object.assign(route, {
      data: { component: "AttendanceManager" },
      params: {},
    });

    await guard.canActivate(route);

    expect(router.navigate).toHaveBeenCalledWith(["/404"]);
  });

  it("should allow AddDayAttendance if user can create an eventType", async () => {
    mockAbility.can.and.returnValue(true);

    const result = await guard.canActivate({
      data: { component: "AddDayAttendance" },
      params: {},
    } as Partial<ActivatedRouteSnapshot> as ActivatedRouteSnapshot);

    expect(result).toBeTrue();
    expect(mockAbility.can).toHaveBeenCalledWith("create", mockEventType);
  });

  it("should block AddDayAttendance if user cannot create any eventType", async () => {
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
    mockAbility.can.and.returnValue(false);
    const route = new ActivatedRouteSnapshot();
    Object.assign(route, {
      data: { component: "AddDayAttendance" },
      params: {},
    });

    await guard.canActivate(route);

    expect(router.navigate).toHaveBeenCalledWith(["/404"]);
  });

  it("should allow RollCall if user can create the entity type from the :id prefix", async () => {
    mockAbility.can.and.returnValue(true);

    const result = await guard.canActivate({
      data: { component: "RollCall" },
      params: { id: `${mockEventType.ENTITY_TYPE}:abc123` },
    } as Partial<ActivatedRouteSnapshot> as ActivatedRouteSnapshot);

    expect(result).toBeTrue();
    expect(mockAbility.can).toHaveBeenCalledWith(
      "create",
      mockEventType.ENTITY_TYPE,
    );
  });

  it("should block RollCall if user cannot create the entity type from the :id prefix", async () => {
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
    mockAbility.can.and.returnValue(false);
    const route = new ActivatedRouteSnapshot();
    Object.assign(route, {
      data: { component: "RollCall" },
      params: { id: `${mockEventType.ENTITY_TYPE}:abc123` },
    });

    await guard.canActivate(route);

    expect(router.navigate).toHaveBeenCalledWith(["/404"]);
  });

  it("should fall back to eventTypes check for RollCall when no entity type in :id (e.g. /new)", async () => {
    mockAbility.can.and.returnValue(true);

    const result = await guard.canActivate({
      data: { component: "RollCall" },
      params: { id: "new" },
    } as Partial<ActivatedRouteSnapshot> as ActivatedRouteSnapshot);

    expect(result).toBeTrue();
    expect(mockAbility.can).toHaveBeenCalledWith("create", mockEventType);
  });

  it("should block RollCall fallback if user cannot create any eventType", async () => {
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
    mockAbility.can.and.returnValue(false);
    const route = new ActivatedRouteSnapshot();
    Object.assign(route, {
      data: { component: "RollCall" },
      params: { id: "new" },
    });

    await guard.canActivate(route);

    expect(router.navigate).toHaveBeenCalledWith(["/404"]);
  });

  it("should allow access for unknown component names", async () => {
    const result = await guard.canActivate({
      data: { component: "SomeOtherComponent" },
      params: {},
    } as Partial<ActivatedRouteSnapshot> as ActivatedRouteSnapshot);

    expect(result).toBeTrue();
    expect(mockAbility.can).not.toHaveBeenCalled();
  });

  it("should check AttendanceManager route permissions in pre-check (checkRoutePermissions)", async () => {
    mockAbility.can.and.returnValue(true);
    TestBed.inject(Router).config.push({
      path: "attendance",
      data: { component: "AttendanceManager" },
    });

    const result = await guard.checkRoutePermissions("attendance");

    expect(result).toBeTrue();
    expect(mockAbility.can).toHaveBeenCalledWith("read", mockActivityType);
  });
});
