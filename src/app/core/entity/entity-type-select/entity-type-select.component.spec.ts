import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityTypeSelectComponent } from "./entity-type-select.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("EntityTypeSelectComponent", () => {
  let component: EntityTypeSelectComponent;
  let fixture: ComponentFixture<EntityTypeSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityTypeSelectComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityTypeSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
