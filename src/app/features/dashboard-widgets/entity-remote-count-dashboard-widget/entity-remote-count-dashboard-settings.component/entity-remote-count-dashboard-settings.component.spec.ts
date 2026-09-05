import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { EntityRemoteCountDashboardSettingsComponent } from "./entity-remote-count-dashboard-settings.component";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { Note } from "#src/app/child-dev-project/notes/model/note";

describe("EntityRemoteCountDashboardSettingsComponent", () => {
  let component: EntityRemoteCountDashboardSettingsComponent;
  let fixture: ComponentFixture<EntityRemoteCountDashboardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EntityRemoteCountDashboardSettingsComponent,
        MockedTestingModule.withState(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      EntityRemoteCountDashboardSettingsComponent,
    );
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      "formControl",
      new FormControl({ entityType: Note.ENTITY_TYPE, groupBy: "category" }),
    );

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("writes the selected entity type and category field back to the form control", () => {
    const formControl = component.formControl();

    component.entityType.set("Todo");
    component.groupBy.set("status");
    fixture.detectChanges();

    expect(formControl.value).toEqual({
      entityType: "Todo",
      groupBy: "status",
    });
  });
});
