import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EnumDropdownComponent } from "./enum-dropdown.component";
import { FormControl } from "@angular/forms";
import { SimpleChange } from "@angular/core";
import { ConfigurableEnumService } from "../configurable-enum.service";
import { ConfigurableEnum } from "../configurable-enum";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("EnumDropdownComponent", () => {
  let component: EnumDropdownComponent;
  let fixture: ComponentFixture<EnumDropdownComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnumDropdownComponent, MockedTestingModule.withState()],
      providers: [
        {
          provide: ConfigurableEnumService,
          useValue: { getEnum: () => new ConfigurableEnum() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnumDropdownComponent);
    component = fixture.componentInstance;

    component.form = new FormControl();
    component.enumId = "test-enum";
    component.ngOnChanges({
      form: new SimpleChange(null, component.form, true),
      enumId: new SimpleChange(null, component.enumId, true),
    });

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should add [invalid option] option from entity if given", () => {
    const invalidOption = {
      id: "INVALID",
      isInvalidOption: true,
      label: "[invalid option] INVALID",
    };
    const invalid2 = {
      id: "X2",
      isInvalidOption: true,
      label: "[invalid option] X2",
    };

    component.form = new FormControl(invalidOption);
    component.ngOnChanges({
      form: new SimpleChange(null, component.form, false),
    });
    expect(component.invalidOptions).toEqual([invalidOption]);

    component.form = new FormControl([invalidOption, invalid2]);
    component.multi = true;
    component.ngOnChanges({
      form: new SimpleChange(null, component.form, false),
    });
    expect(component.invalidOptions).toEqual([invalidOption, invalid2]);
  });
});
