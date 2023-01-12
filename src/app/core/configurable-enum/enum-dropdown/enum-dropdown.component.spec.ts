import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EnumDropdownComponent } from "./enum-dropdown.component";
import { ConfigService } from "../../config/config.service";
import { FormControl } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { SimpleChange } from "@angular/core";

describe("EnumDropdownComponent", () => {
  let component: EnumDropdownComponent;
  let fixture: ComponentFixture<EnumDropdownComponent>;

  let mockConfigService: jasmine.SpyObj<ConfigService>;

  beforeEach(async () => {
    mockConfigService = jasmine.createSpyObj(["getConfig"]);
    mockConfigService.getConfig.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [EnumDropdownComponent, NoopAnimationsModule],
      providers: [{ provide: ConfigService, useValue: mockConfigService }],
    }).compileComponents();

    fixture = TestBed.createComponent(EnumDropdownComponent);
    component = fixture.componentInstance;

    component.form = new FormControl();
    component.enumId = "test-enum";

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
