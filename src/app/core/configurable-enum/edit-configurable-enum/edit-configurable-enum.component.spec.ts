import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditConfigurableEnumComponent } from "./edit-configurable-enum.component";
import { EntityDetailsModule } from "../../entity-components/entity-details/entity-details.module";
import { ReactiveFormsModule, FormControl, FormGroup } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ConfigService } from "../../config/config.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { ConfigurableEnumModule } from "../configurable-enum.module";

describe("EditConfigurableEnumComponent", () => {
  let component: EditConfigurableEnumComponent;
  let fixture: ComponentFixture<EditConfigurableEnumComponent>;

  let mockConfigService: jasmine.SpyObj<ConfigService>;

  beforeEach(async () => {
    mockConfigService = jasmine.createSpyObj(["getConfig"]);
    mockConfigService.getConfig.and.returnValue([]);
    await TestBed.configureTestingModule({
      imports: [
        EntityDetailsModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        ConfigurableEnumModule,
      ],
      declarations: [EditConfigurableEnumComponent],
      providers: [{ provide: ConfigService, useValue: mockConfigService }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditConfigurableEnumComponent);
    component = fixture.componentInstance;
    component.parent = new FormGroup({});
    component.formControlName = "testControl";
    component.formControl = new FormControl({ id: "", label: "" });
    component.parent.registerControl(
      component.formControlName,
      component.formControl
    );
    component.enumId = "";
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
