import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { EntityActionsMenuComponent } from "./entity-actions-menu.component";
import { EntityRemoveService } from "../../entity/entity-remove.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("EntityActionsMenuComponent", () => {
  let component: EntityActionsMenuComponent;
  let fixture: ComponentFixture<EntityActionsMenuComponent>;

  let mockEntityRemoveService: jasmine.SpyObj<EntityRemoveService> =
    jasmine.createSpyObj(["remove"]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EntityActionsMenuComponent, MockedTestingModule],
      providers: [
        { provide: EntityRemoveService, useValue: mockEntityRemoveService },
      ],
    });
    fixture = TestBed.createComponent(EntityActionsMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit actionTriggered Output upon action", fakeAsync(() => {
    mockEntityRemoveService.delete.and.resolveTo(true);

    let actionEvent;
    component.actionTriggered.subscribe((x) => (actionEvent = x));

    component.executeAction("delete");
    tick();

    expect(actionEvent).toBe("delete");
  }));
});
