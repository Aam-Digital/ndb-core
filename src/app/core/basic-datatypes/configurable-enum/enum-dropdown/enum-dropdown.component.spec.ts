import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EnumDropdownComponent } from "./enum-dropdown.component";
import { FormControl } from "@angular/forms";
import { SimpleChange } from "@angular/core";
import { ConfigurableEnum } from "../configurable-enum";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";

describe("EnumDropdownComponent", () => {
  let component: EnumDropdownComponent;
  let fixture: ComponentFixture<EnumDropdownComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockAbility: jasmine.SpyObj<EntityAbility>;

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj(["open"]);
    mockAbility = jasmine.createSpyObj(["can"]);
    mockAbility.can.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [EnumDropdownComponent, MockedTestingModule.withState()],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: EntityAbility, useValue: mockAbility },
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
    const resCanceled = await component.createNewOption("second");

    expect(confirmationSpy).toHaveBeenCalled();
    expect(saveSpy).not.toHaveBeenCalled();
    expect(resCanceled).toBeUndefined();

    // create and save new upon confirmation
    confirmationSpy.and.resolveTo(true);
    const res = await component.createNewOption("second");

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
    component.form = new FormControl({
      id: "a",
      label: "a",
      isInvalidOption: true,
    });

    component.ngOnChanges({ form: true } as any);

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
    component.form = new FormControl(option1);

    component.ngOnChanges({ form: true } as any);

    // simulate removing option "2"
    mockDialog.open.and.returnValue({ afterClosed: () => of({}) } as any);
    component.enumEntity.values.pop();
    component.openSettings({ stopPropagation: () => {} } as any);

    expect(component.options).toEqual([option1]);
    expect(component.form.value).toEqual(option1);

    // simulate removing option "1"
    component.enumEntity.values.pop();
    component.openSettings({ stopPropagation: () => {} } as any);

    expect(component.options).toEqual([]);
    expect(component.form.value).toEqual(undefined);
  });
});
