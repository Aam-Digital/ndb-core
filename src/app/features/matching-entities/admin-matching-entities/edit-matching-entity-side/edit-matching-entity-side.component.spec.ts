import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditMatchingEntitySideComponent } from "./edit-matching-entity-side.component";
import { MatDialog } from "@angular/material/dialog";
import {
  entityRegistry,
  EntityRegistry,
} from "#src/app/core/entity/database-entity.decorator";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";

describe("EditMatchingEntitySideComponent", () => {
  let component: EditMatchingEntitySideComponent;
  let fixture: ComponentFixture<EditMatchingEntitySideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditMatchingEntitySideComponent, MockedTestingModule],
      providers: [
        {
          provide: EntityRegistry,
          useValue: entityRegistry,
        },
        {
          provide: MatDialog,
          useValue: { open: jasmine.createSpy("open") },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditMatchingEntitySideComponent);
    component = fixture.componentInstance;

    component.sideConfig = {
      entityType: TestEntity.ENTITY_TYPE,
      columns: [],
      availableFilters: [],
    };

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
