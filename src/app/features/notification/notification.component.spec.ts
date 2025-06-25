import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationComponent } from "./notification.component";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapperProvider } from "../../core/entity/entity-mapper/mock-entity-mapper-service";
import { SessionSubject } from "../../core/session/auth/session-info";
import { of } from "rxjs";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ActivatedRoute } from "@angular/router";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { DatabaseResolverService } from "../../core/database/database-resolver.service";

describe("NotificationComponent", () => {
  let component: NotificationComponent;
  let fixture: ComponentFixture<NotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotificationComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapperProvider() },
        { provide: SessionSubject, useValue: of(null) },
        { provide: ActivatedRoute, useValue: {} },
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: DatabaseResolverService,
          useValue: jasmine.createSpyObj([
            "initializeNotificationsDatabaseForCurrentUser",
          ]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
