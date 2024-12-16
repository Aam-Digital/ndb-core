import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityTypeSelect } from "./entity-type-select.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("EntityTypeSelect", () => {
  let component: EntityTypeSelect;
  let fixture: ComponentFixture<EntityTypeSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityTypeSelect, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityTypeSelect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
