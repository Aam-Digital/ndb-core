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

  it("omits hiddenTypes from the available options", () => {
    fixture.componentRef.setInput("showInternalTypes", true);
    const all = component["optionsSource"]().map((t) => t.ENTITY_TYPE);
    expect(all.length).toBeGreaterThan(0);

    const hidden = all[0];
    fixture.componentRef.setInput("hiddenTypes", [hidden]);
    fixture.detectChanges();

    const filtered = component["optionsSource"]().map((t) => t.ENTITY_TYPE);
    expect(filtered).not.toContain(hidden);
    expect(filtered).toHaveLength(all.length - 1);
  });
});
