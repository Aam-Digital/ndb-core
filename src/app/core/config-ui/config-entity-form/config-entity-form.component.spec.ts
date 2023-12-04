import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  ConfigEntityFormComponent,
  FormConfig,
} from "./config-entity-form.component";
import { ConfigUiModule } from "../config-ui.module";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { MatDialog } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ConfigEntityFormComponent", () => {
  let component: ConfigEntityFormComponent;
  let fixture: ComponentFixture<ConfigEntityFormComponent>;

  const testConfig: FormConfig = {
    fieldGroups: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConfigUiModule, CoreTestingModule, FontAwesomeTestingModule],
      providers: [
        {
          provide: EntityFormService,
          useValue: jasmine.createSpyObj(["extendFormFieldConfig"]),
        },
        {
          provide: MatDialog,
          useValue: jasmine.createSpyObj(["open"]),
        },
      ],
    });
    fixture = TestBed.createComponent(ConfigEntityFormComponent);
    component = fixture.componentInstance;

    component.config = testConfig;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
