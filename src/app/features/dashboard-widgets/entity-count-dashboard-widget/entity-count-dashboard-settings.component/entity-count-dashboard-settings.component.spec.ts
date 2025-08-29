import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityCountDashboardSettingsComponent } from "./entity-count-dashboard-settings.component";
import { FormControl } from "@angular/forms";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";

describe("EntityCountDashboardSettingsComponent", () => {
  let component: EntityCountDashboardSettingsComponent;
  let fixture: ComponentFixture<EntityCountDashboardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EntityCountDashboardSettingsComponent,
        MockedTestingModule.withState(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityCountDashboardSettingsComponent);
    component = fixture.componentInstance;

    component.formControl = new FormControl({
      entityType: "Child",
      groupBy: ["center", "gender"],
    });

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
