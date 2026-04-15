import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayTodoCompletionComponent } from "./display-todo-completion.component";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "../../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

describe("DisplayTodoCompletionComponent", () => {
  let component: DisplayTodoCompletionComponent;
  let fixture: ComponentFixture<DisplayTodoCompletionComponent>;
  let entityMapper: MockEntityMapperService;
  let iconLibrary: FaIconLibrary;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayTodoCompletionComponent],
      providers: [
        ...mockEntityMapperProvider(),
        {
          provide: EntityRegistry,
          useValue: { entityRegistry },
        },
      ],
    }).compileComponents();

    iconLibrary = TestBed.inject(FaIconLibrary);
    iconLibrary.addIcons(faCheck);

    fixture = TestBed.createComponent(DisplayTodoCompletionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load the entity in completedBy when it has full ID", async () => {
    vi.useFakeTimers();
    try {
      const completingChild = new TestEntity("1");
      const otherChild = new TestEntity("2");
      entityMapper.addAll([completingChild, otherChild]);

      component.value = {
        completedBy: completingChild.getId(),
        completedAt: new Date(),
      };
      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.completedBy).toEqual(completingChild);
    } finally {
      vi.useRealTimers();
    }
  });
});
