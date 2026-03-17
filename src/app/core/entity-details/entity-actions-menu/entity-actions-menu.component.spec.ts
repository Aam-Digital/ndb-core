import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityActionsMenuComponent } from "./entity-actions-menu.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityActionsMenuService } from "./entity-actions-menu.service";
import { EntityAction } from "./entity-action.interface";
import { Entity } from "../../entity/model/entity";

describe("EntityActionsMenuComponent", () => {
  let component: EntityActionsMenuComponent;
  let fixture: ComponentFixture<EntityActionsMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EntityActionsMenuComponent, MockedTestingModule.withState()],
      providers: [EntityActionsMenuService],
    });
    fixture = TestBed.createComponent(EntityActionsMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit actionTriggered Output upon action", async () => {
    vi.useFakeTimers();
    try {
      const testAction: EntityAction = {
        action: "test_action",
        label: "Test Action",
        icon: "test_icon",
        execute: () => null,
        availableFor: "all",
      };
      vi.spyOn(testAction, "execute").mockResolvedValue(true);

      const actionsService = TestBed.inject(EntityActionsMenuService);
      actionsService.registerActions([testAction]);
      component.entity = new Entity();

      let actionEvent;
      component.actionTriggered.subscribe((x) => (actionEvent = x));
      component.ngOnChanges({ entity: { currentValue: {} } as any });

      component.executeAction(testAction);
      await vi.advanceTimersByTimeAsync(0);

      expect(testAction.execute).toHaveBeenCalledWith(component.entity, false);
      expect(actionEvent).toBe("test_action");
    } finally {
      vi.useRealTimers();
    }
  });
});
