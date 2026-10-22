import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import {
  EntityCountDashboardConfig,
  EntityCountDashboardSettingsComponent,
} from "./entity-count-dashboard-settings.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";

describe("EntityCountDashboardSettingsComponent", () => {
  let fixture: ComponentFixture<EntityCountDashboardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EntityCountDashboardSettingsComponent,
        MockedTestingModule.withState(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityCountDashboardSettingsComponent);
  });

  it("should require an entity type to be selected", () => {
    const formControl = new FormControl<EntityCountDashboardConfig>({
      groupBy: ["gender"],
    });
    fixture.componentRef.setInput("formControl", formControl);
    fixture.detectChanges();
    expect(formControl.invalid).toBe(true);

    fixture.componentInstance.entityType.set("Child");
    fixture.detectChanges();

    expect(formControl.valid).toBe(true);
    expect(formControl.value).toEqual({
      entityType: "Child",
      groupBy: ["gender"],
    });
  });
});
