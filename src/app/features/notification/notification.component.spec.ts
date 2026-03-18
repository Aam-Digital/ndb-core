import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationComponent } from "./notification.component";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { SessionSubject } from "../../core/session/auth/session-info";
import { NEVER, of } from "rxjs";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ActivatedRoute } from "@angular/router";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { DatabaseResolverService } from "../../core/database/database-resolver.service";
import type { Mock } from "vitest";

type EntityMapperMock = Pick<
  EntityMapperService,
  "receiveUpdates" | "load" | "loadType"
> & {
  receiveUpdates: Mock;
  load: Mock;
  loadType: Mock;
};

describe("NotificationComponent", () => {
  let component: NotificationComponent;
  let fixture: ComponentFixture<NotificationComponent>;

  let mockEntityMapper: EntityMapperMock;

  beforeEach(async () => {
    mockEntityMapper = {
      receiveUpdates: vi.fn(),
      load: vi.fn(),
      loadType: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        NotificationComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: SessionSubject, useValue: of(null) },
        { provide: ActivatedRoute, useValue: {} },
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: DatabaseResolverService,
          useValue: {
            initializeNotificationsDatabaseForCurrentUser: vi.fn(),
            getCurrentUserDatabase: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compileComponents();

    mockEntityMapper.receiveUpdates.mockReturnValue(NEVER);
    mockEntityMapper.load.mockRejectedValue(
      new Error("No notification config"),
    );
    mockEntityMapper.loadType.mockResolvedValue([]);

    fixture = TestBed.createComponent(NotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
