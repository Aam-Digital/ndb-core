import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityTypeSelectorComponent } from "./entity-type-selector.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("EntityTypeSelectorComponent", () => {
  let component: EntityTypeSelectorComponent;
  let fixture: ComponentFixture<EntityTypeSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityTypeSelectorComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityTypeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
