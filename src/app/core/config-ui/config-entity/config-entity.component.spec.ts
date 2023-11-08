import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ConfigEntityComponent } from "./config-entity.component";
import { ConfigUiModule } from "../config-ui.module";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { Child } from "../../../child-dev-project/children/model/child";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ConfigEntityComponent", () => {
  let component: ConfigEntityComponent;
  let fixture: ComponentFixture<ConfigEntityComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConfigUiModule, CoreTestingModule, FontAwesomeTestingModule],
    });
    fixture = TestBed.createComponent(ConfigEntityComponent);
    component = fixture.componentInstance;

    component.entityType = Child.ENTITY_TYPE;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
