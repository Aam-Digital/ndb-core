import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MatDialog } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { setupCustomFormControlEditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { ConfigurableEnum } from "../configurable-enum";
import { ConfigurableEnumService } from "../configurable-enum.service";
import { EditConfigurableEnumComponent } from "./edit-configurable-enum.component";

describe("EditConfigurableEnumComponent", () => {
  let component: EditConfigurableEnumComponent;
  let fixture: ComponentFixture<EditConfigurableEnumComponent>;
  let mockDialog: any;
  let mockAbility: any;
  let enumEntity: ConfigurableEnum;
  let enumService: ConfigurableEnumService;

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn(),
    };
    mockAbility = {
      can: vi.fn(),
    };
    mockAbility.can.mockReturnValue(true);

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
    const enumById: Record<string, ConfigurableEnum> = {
      "some-id": new ConfigurableEnum("some-id"),
      "some-other-id": new ConfigurableEnum("some-other-id"),
    };
    enumEntity = enumById["some-id"];
    enumService = TestBed.inject(ConfigurableEnumService);
    vi.spyOn(enumService, "getEnum").mockImplementation(
      (id: string) => enumById[id] ?? enumEntity,
    );
    setupCustomFormControlEditComponent(
      component,
      "test",
      {
        additional: "some-id",
      },
      fixture,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should extract the enum ID", () => {
    expect(component.enumId()).toBe("some-id");
  });

  it("should detect multi selection mode", async () => {
    expect(component.multi()).toBeFalsy();

    fixture.componentRef.setInput("formFieldConfig", {
      id: "test",
      additional: "some-id",
      isArray: true,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.multi()).toBe(true);
  });

  it("should clear createNewOption when enum is not editable", () => {
    expect(component.createNewOption()).toBeDefined();

    mockAbility.can.mockReturnValue(false);
    fixture.componentRef.setInput("formFieldConfig", {
      id: "test",
      additional: "some-other-id",
    });
    fixture.detectChanges();

    expect(component.canEdit()).toBe(false);
    expect(component.createNewOption()).toBeUndefined();
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
    expect(component.invalidOptions()).toEqual([invalidOption]);

    fixture.componentRef.setInput("formFieldConfig", {
      id: "test",
      additional: "some-id",
      isArray: true,
    });
    fixture.detectChanges();

    component.ngControl.control.setValue([invalidOption, invalid2]);
    component.ngControl.control.setValue([invalidOption, invalid2]);
    expect(component.invalidOptions()).toEqual([invalidOption, invalid2]);
  });

  it("should extend the existing enum with the new option", async () => {
    const confirmationSpy = vi.spyOn(
      TestBed.inject<ConfirmationDialogService>(ConfirmationDialogService),
      "getConfirmation",
    );
    const saveSpy = vi.spyOn(TestBed.inject(EntityMapperService), "save");

    enumEntity.values = [{ id: "1", label: "first" }];

    // abort if confirmation dialog declined
    confirmationSpy.mockResolvedValue(false);
    const resCanceled = await component.addNewOption("second");

    expect(confirmationSpy).toHaveBeenCalled();
    expect(saveSpy).not.toHaveBeenCalled();
    expect(resCanceled).toBeUndefined();

    // create and save new upon confirmation
    confirmationSpy.mockResolvedValue(true);
    const res = await component.addNewOption("second");

    expect(confirmationSpy).toHaveBeenCalled();
    expect(res).toEqual({ id: "SECOND", label: "second" });
    expect(enumEntity.values).toEqual([
      { id: "1", label: "first" },
      { id: "SECOND", label: "second" },
    ]);
    expect(saveSpy).toHaveBeenCalledWith(enumEntity);
  });

  it("should open the configure enum dialog and re-initialize the available options afterwards", async () => {
    enumEntity.values = [{ id: "1", label: "1" }];
    component.ngControl.control.setValue({
      id: "a",
      label: "a",
      isInvalidOption: true,
    });

    expect(component.options()).toEqual([
      { id: "1", label: "1" },
      { id: "a", label: "a", isInvalidOption: true },
    ]);

    mockDialog.open.mockReturnValue({ afterClosed: () => of({}) } as any);
    enumEntity.values.push({ id: "2", label: "2" });

    component.openSettings({ stopPropagation: () => {} } as any);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(component.options()).toEqual([
      { id: "1", label: "1" },
      { id: "2", label: "2" },
      { id: "a", label: "a", isInvalidOption: true },
    ]);
  });

  it("should delete the selected value if the option was deleted in the settings dialog", () => {
    const option1 = { id: "1", label: "1" };
    const option2 = { id: "2", label: "2" };
    enumEntity.values = [option1, option2];
    component.ngControl.control.setValue(option1);

    // simulate removing option "2"
    mockDialog.open.mockReturnValue({ afterClosed: () => of({}) } as any);
    enumEntity.values.pop();
    component.openSettings({ stopPropagation: () => {} } as any);

    expect(component.options()).toEqual([option1]);
    expect(component.formControl.value).toEqual(option1);

    // simulate removing option "1"
    enumEntity.values.pop();
    component.openSettings({ stopPropagation: () => {} } as any);

    expect(component.options()).toEqual([]);
    expect(component.formControl.value).toEqual(undefined);
  });
});
