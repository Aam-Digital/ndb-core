import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MatDialog } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { setupCustomFormControlEditComponent } from "../../../entity/default-datatype/edit-component.spec";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { ConfigurableEnum } from "../configurable-enum";
import { EditConfigurableEnumComponent } from "./edit-configurable-enum.component";

describe("EditConfigurableEnumComponent", () => {
  let component: EditConfigurableEnumComponent;
  let fixture: ComponentFixture<EditConfigurableEnumComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockAbility: jasmine.SpyObj<EntityAbility>;

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj(["open"]);
    mockAbility = jasmine.createSpyObj(["can"]);
    mockAbility.can.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [
        EditConfigurableEnumComponent,
        MockedTestingModule.withState(),
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: EntityAbility, useValue: mockAbility },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditConfigurableEnumComponent);
    component = fixture.componentInstance;
    setupCustomFormControlEditComponent(component, "test", {
      additional: "some-id",
    });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should extract the enum ID", () => {
    setupCustomFormControlEditComponent(component, "test", {
      additional: "some-id",
    });
    console.log("After setup, formFieldConfig:", component.formFieldConfig);
    component.ngOnInit();
    console.log("After ngOnInit, enumId:", component.enumId);
    expect(component.enumId).toBe("some-id");
  });

  it("should detect multi selection mode", () => {
    setupCustomFormControlEditComponent(component, "test", {
      additional: "some-id",
    });
    component.ngOnInit();
    expect(component.multi).toBeFalsy();

    setupCustomFormControlEditComponent(component, "test", {
      isArray: true,
      additional: "some-id",
    });
    component.ngOnInit();
    expect(component.multi).toBeTrue();
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

    component.ngControl.control.setValue(invalidOption);
    component.ngOnChanges();
    expect(component.invalidOptions).toEqual([invalidOption]);

    component.ngControl.control.setValue([invalidOption, invalid2]);
    component.multi = true;
    component.ngOnChanges();
    expect(component.invalidOptions).toEqual([invalidOption, invalid2]);
  });

  it("should extend the existing enum with the new option", async () => {
    const confirmationSpy = spyOn(
      TestBed.inject<ConfirmationDialogService>(ConfirmationDialogService),
      "getConfirmation",
    );
    const saveSpy = spyOn(TestBed.inject(EntityMapperService), "save");

    const enumEntity = new ConfigurableEnum();
    enumEntity.values = [{ id: "1", label: "first" }];
    component.enumEntity = enumEntity;

    // abort if confirmation dialog declined
    confirmationSpy.and.resolveTo(false);
    const resCanceled = await component.addNewOption("second");

    expect(confirmationSpy).toHaveBeenCalled();
    expect(saveSpy).not.toHaveBeenCalled();
    expect(resCanceled).toBeUndefined();

    // create and save new upon confirmation
    confirmationSpy.and.resolveTo(true);
    const res = await component.addNewOption("second");

    expect(confirmationSpy).toHaveBeenCalled();
    expect(res).toEqual({ id: "SECOND", label: "second" });
    expect(enumEntity.values).toEqual([
      { id: "1", label: "first" },
      { id: "SECOND", label: "second" },
    ]);
    expect(saveSpy).toHaveBeenCalledWith(enumEntity);
  });

  it("should open the configure enum dialog and re-initialize the available options afterwards", () => {
    component.enumEntity = new ConfigurableEnum();
    component.enumEntity.values = [{ id: "1", label: "1" }];
    component.ngControl.control.setValue({
      id: "a",
      label: "a",
      isInvalidOption: true,
    });

    component.ngOnChanges();

    expect(component.options).toEqual([
      { id: "1", label: "1" },
      { id: "a", label: "a", isInvalidOption: true },
    ]);

    mockDialog.open.and.returnValue({ afterClosed: () => of({}) } as any);
    component.enumEntity.values.push({ id: "2", label: "2" });

    component.openSettings({ stopPropagation: () => {} } as any);

    expect(mockDialog.open).toHaveBeenCalled();
    expect(component.options).toEqual([
      { id: "1", label: "1" },
      { id: "2", label: "2" },
      { id: "a", label: "a", isInvalidOption: true },
    ]);
  });

  it("should delete the selected value if the option was deleted in the settings dialog", () => {
    component.enumEntity = new ConfigurableEnum();
    const option1 = { id: "1", label: "1" };
    const option2 = { id: "2", label: "2" };
    component.enumEntity.values = [option1, option2];
    component.ngControl.control.setValue(option1);

    component.ngOnChanges();

    // simulate removing option "2"
    mockDialog.open.and.returnValue({ afterClosed: () => of({}) } as any);
    component.enumEntity.values.pop();
    component.openSettings({ stopPropagation: () => {} } as any);

    expect(component.options).toEqual([option1]);
    expect(component.formControl.value).toEqual(option1);

    // simulate removing option "1"
    component.enumEntity.values.pop();
    component.openSettings({ stopPropagation: () => {} } as any);

    expect(component.options).toEqual([]);
    expect(component.formControl.value).toEqual(undefined);
  });
});
