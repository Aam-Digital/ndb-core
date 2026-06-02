import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationLinkComponent } from "./notification-link.component";
import { ActivatedRoute, convertToParamMap, Router } from "@angular/router";
import {
  EntityRegistry,
  entityRegistry,
} from "app/core/entity/database-entity.decorator";
import {
  MockEntityMapperService,
  mockEntityMapperProvider,
} from "app/core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { BehaviorSubject } from "rxjs";
import { NotificationEvent } from "../model/notification-event";

describe("NotificationLinkComponent", () => {
  let component: NotificationLinkComponent;
  let fixture: ComponentFixture<NotificationLinkComponent>;
  let router: Router;
  let entityMapper: MockEntityMapperService;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const createComponent = (id?: string, runEffects = true) => {
    paramMap$.next(convertToParamMap(id ? { id } : {}));
    fixture = TestBed.createComponent(NotificationLinkComponent);
    component = fixture.componentInstance;
    if (runEffects) {
      fixture.detectChanges();
    }
  };

  beforeEach(async () => {
    paramMap$ = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [NotificationLinkComponent],
      providers: [
        ...mockEntityMapperProvider(),
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$,
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
    vi.spyOn(router, "navigate").mockResolvedValue(true);
    vi.spyOn(router, "navigateByUrl").mockResolvedValue(true);
  });

  it("should create", () => {
    createComponent();

    expect(component).toBeTruthy();
  });

  it("should navigate to user-account when notification id is missing", async () => {
    createComponent();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(["/user-account"]);
  });

  it("should load notification event and navigate to action URL", async () => {
    vi.useFakeTimers();
    try {
      const event = new NotificationEvent("notif-123");
      event.actionURL = "/entity-url";
      vi.spyOn(entityMapper, "load").mockResolvedValue(
        event as unknown as NotificationEvent,
      );
      vi.spyOn(entityMapper, "save").mockResolvedValue(undefined);
      createComponent("notif-123");
      await vi.advanceTimersByTimeAsync(1);

      expect(router.navigateByUrl).toHaveBeenCalledWith("/entity-url");
      expect(entityMapper.save).toHaveBeenCalledWith(
        expect.objectContaining({ readStatus: true }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should navigate using context entity URL when available", async () => {
    vi.useFakeTimers();
    try {
      const event = new NotificationEvent("notif-123");
      event.context = {
        entityType: "NotificationEvent",
        entityId: "NotificationEvent:notif-123",
      };
      vi.spyOn(entityMapper, "load").mockResolvedValue(event as any);
      vi.spyOn(entityMapper, "save").mockResolvedValue(undefined);
      createComponent("notif-123");
      await vi.advanceTimersByTimeAsync(1);

      expect(router.navigateByUrl).toHaveBeenCalledWith(
        "/c/notificationevent/NotificationEvent:notif-123",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should navigate to user-account when notification load throws an error", async () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(entityMapper, "load").mockRejectedValue(new Error("not found"));
      createComponent("notif-123");
      await vi.advanceTimersByTimeAsync(1);

      expect(router.navigate).toHaveBeenCalledWith(["/user-account"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should navigate to user-account when notification load times out", async () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(entityMapper, "load").mockReturnValue(new Promise(() => {}));
      createComponent("notif-123");
      await vi.advanceTimersByTimeAsync(5000);
      await fixture.whenStable();

      expect(router.navigate).toHaveBeenCalledWith(["/user-account"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should mark notification as read during id-based redirect", async () => {
    vi.useFakeTimers();
    try {
      const event = Object.assign(new NotificationEvent("notif-123"), {
        readStatus: false,
        actionURL: "/target",
      });
      vi.spyOn(entityMapper, "load").mockResolvedValue(event as any);
      vi.spyOn(entityMapper, "save").mockResolvedValue(undefined);
      createComponent("notif-123");
      await vi.advanceTimersByTimeAsync(1);

      expect(entityMapper.save).toHaveBeenCalledWith(
        expect.objectContaining({ readStatus: true }),
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
