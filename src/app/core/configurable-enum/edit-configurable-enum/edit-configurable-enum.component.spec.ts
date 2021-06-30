import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditConfigurableEnumComponent } from "./edit-configurable-enum.component";
import { EntityDetailsModule } from "../../entity-components/entity-details/entity-details.module";
import { FormControl, FormGroup } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ConfigService } from "../../config/config.service";

describe("EditConfigurableEnumComponent", () => {
  let component: EditConfigurableEnumComponent;
  let fixture: ComponentFixture<EditConfigurableEnumComponent>;

  let mockConfigService: jasmine.SpyObj<ConfigService>;

  beforeEach(async () => {
    mockConfigService = jasmine.createSpyObj(["getConfig"]);
    mockConfigService.getConfig.and.returnValue([]);
    await TestBed.configureTestingModule({
      imports: [EntityDetailsModule, NoopAnimationsModule],
      declarations: [EditConfigurableEnumComponent],
      providers: [{ provide: ConfigService, useValue: mockConfigService }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditConfigurableEnumComponent);
    component = fixture.componentInstance;
    const formControl = new FormControl();
    const formGroup = new FormGroup({});
    component.formControlName = "testControl";
    component.formControl = formControl;
    formGroup.registerControl(component.formControlName, formControl);
    component.enumId = "";
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
