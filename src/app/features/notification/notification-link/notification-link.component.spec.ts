import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationLinkComponent } from "./notification-link.component";
import { ActivatedRoute, Router } from "@angular/router";
import {
  EntityRegistry,
  entityRegistry,
} from "app/core/entity/database-entity.decorator";
import {
  MockEntityMapperService,
  mockEntityMapperProvider,
} from "app/core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { NotificationEvent } from "../model/notification-event";

describe("NotificationLinkComponent", () => {
  let component: NotificationLinkComponent;
  let fixture: ComponentFixture<NotificationLinkComponent>;
  let router: Router;
  let entityMapper: MockEntityMapperService;
  let paramMapGet: ReturnType<typeof vi.fn>;
  let queryParamMapGet: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    paramMapGet = vi.fn();
    queryParamMapGet = vi.fn();

    await TestBed.configureTestingModule({
      imports: [NotificationLinkComponent],
      providers: [
        ...mockEntityMapperProvider(),
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: paramMapGet },
              queryParamMap: { get: queryParamMapGet },
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
    vi.spyOn(router, "navigate").mockResolvedValue(true);

    fixture = TestBed.createComponent(NotificationLinkComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should navigate immediately without DB load when entityType query param is present", async () => {
    paramMapGet.mockReturnValue("notif-123");
    queryParamMapGet.mockImplementation((key: string) => {
      if (key === "entityType") return "UnknownType"; // triggers /user-account via buildEntityUrl
      return null;
    });
    vi.spyOn(entityMapper, "load").mockReturnValue(new Promise(() => {}));

    await component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(["/user-account"]);
  });

  it("should navigate to user-account when entityType is not registered", async () => {
    paramMapGet.mockReturnValue("notif-123");
    queryParamMapGet.mockImplementation((key: string) => {
      if (key === "entityType") return "UnknownEntityType";
      return null;
    });

    await component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(["/user-account"]);
  });

  it("should load notification event and navigate to entity URL when no query params", async () => {
    paramMapGet.mockReturnValue("notif-123");
    queryParamMapGet.mockReturnValue(null);

    const event = new NotificationEvent("notif-123");
    event.actionURL = "/entity-url";
    vi.spyOn(entityMapper, "load").mockResolvedValue(event as any);
    vi.spyOn(entityMapper, "save").mockResolvedValue(undefined);

    await component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(["/entity-url"]);
  });

  it("should navigate to user-account when notification load throws an error", async () => {
    paramMapGet.mockReturnValue("notif-123");
    queryParamMapGet.mockReturnValue(null);
    vi.spyOn(entityMapper, "load").mockRejectedValue(new Error("not found"));

    await component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(["/user-account"]);
  });

  it("should navigate to user-account when notification load times out", async () => {
    vi.useFakeTimers();
    paramMapGet.mockReturnValue("notif-123");
    queryParamMapGet.mockReturnValue(null);
    vi.spyOn(entityMapper, "load").mockReturnValue(new Promise(() => {}));

    const initPromise = component.ngOnInit();
    await vi.advanceTimersByTimeAsync(5000);
    await initPromise;
    vi.useRealTimers();

    expect(router.navigate).toHaveBeenCalledWith(["/user-account"]);
  });

  it("should mark notification as read after navigating via query params", async () => {
    paramMapGet.mockReturnValue("notif-123");
    queryParamMapGet.mockImplementation((key: string) => {
      if (key === "entityType") return "UnknownType";
      return null;
    });
    vi.spyOn(entityMapper, "load").mockResolvedValue(
      Object.assign(new NotificationEvent("notif-123"), {
        readStatus: false,
      }) as any,
    );
    vi.spyOn(entityMapper, "save").mockResolvedValue(undefined);

    await component.ngOnInit();
    await new Promise((r) => setTimeout(r, 0)); // flush microtasks for background markAsRead

    expect(entityMapper.save).toHaveBeenCalled();
  });
});
