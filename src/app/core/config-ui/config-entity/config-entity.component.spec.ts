import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ConfigEntityComponent } from "./config-entity.component";
import { ConfigUiModule } from "../config-ui.module";
import { Child } from "../../../child-dev-project/children/model/child";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("ConfigEntityComponent", () => {
  let component: ConfigEntityComponent;
  let fixture: ComponentFixture<ConfigEntityComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule, ConfigUiModule],
    });
    fixture = TestBed.createComponent(ConfigEntityComponent);
    component = fixture.componentInstance;

    component.entityType = Child.ENTITY_TYPE;

    fixture.detectChanges();
  });

  xit("should create", () => {
    expect(component).toBeTruthy();
  });
});
