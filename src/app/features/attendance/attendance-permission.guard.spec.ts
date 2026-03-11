import { TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRouteSnapshot, Router } from "@angular/router";
import { AttendancePermissionGuard } from "./attendance-permission.guard";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import { AttendanceService } from "./attendance.service";

describe("AttendancePermissionGuard", () => {
  let guard: AttendancePermissionGuard;
  let mockAbility: jasmine.SpyObj<EntityAbility>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  const mockActivityType = { ENTITY_TYPE: "RecurringActivity" } as any;
  const mockEventType = { ENTITY_TYPE: "EventNote" } as any;

  beforeEach(() => {
    mockAbility = jasmine.createSpyObj(["can"], { rules: [{}] });
    mockAttendanceService = {
      featureSettings: {
        eventTypeSettings: [],
        recurringActivityTypes: [mockActivityType],
        eventTypes: [mockEventType],
        filterConfig: [],
      },
    } as any;

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
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
      params: { id: "EventNote:abc123" },
    } as Partial<ActivatedRouteSnapshot> as ActivatedRouteSnapshot);

    expect(result).toBeTrue();
    expect(mockAbility.can).toHaveBeenCalledWith("create", "EventNote");
  });

  it("should block RollCall if user cannot create the entity type from the :id prefix", async () => {
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
    mockAbility.can.and.returnValue(false);
    const route = new ActivatedRouteSnapshot();
    Object.assign(route, {
      data: { component: "RollCall" },
      params: { id: "EventNote:abc123" },
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
