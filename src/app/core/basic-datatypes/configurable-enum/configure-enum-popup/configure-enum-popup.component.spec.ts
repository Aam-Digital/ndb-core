import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ConfigureEnumPopupComponent } from "./configure-enum-popup.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ConfigurableEnum } from "../configurable-enum";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { EMPTY } from "rxjs";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../../../entity/entity-mapper/mock-entity-mapper-service";
import { genders } from "../../../../child-dev-project/children/model/genders";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import {
  entityRegistry,
  EntityRegistry,
} from "../../../entity/database-entity.decorator";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

describe("ConfigureEnumPopupComponent", () => {
  let component: ConfigureEnumPopupComponent;
  let fixture: ComponentFixture<ConfigureEnumPopupComponent>;
  let entityMapper: MockEntityMapperService;

  beforeEach(async () => {
    entityMapper = mockEntityMapper();
    await TestBed.configureTestingModule({
      imports: [
        ConfigureEnumPopupComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: new ConfigurableEnum() },
        { provide: MatDialogRef, useValue: { afterClosed: () => EMPTY } },
        { provide: EntityMapperService, useValue: entityMapper },
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigureEnumPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show a popup if user tries to delete an enum that is still in use", async () => {
    component.enumEntity = new ConfigurableEnum("genders");
    component.enumEntity.values = genders;
    const male = genders.find((g) => g.id === "M");
    const female = genders.find((g) => g.id === "F");
    const m1 = new TestEntity();
    m1.category = male;
    const m2 = new TestEntity();
    m2.category = male;
    const f1 = new TestEntity();
    f1.category = female;
    const other = new TestEntity();
    entityMapper.addAll([m1, m2, f1, other]);
    const confirmationSpy = spyOn(
      TestBed.inject(ConfirmationDialogService),
      "getConfirmation",
    );

    await component.delete(male, genders.indexOf(male));

    expect(confirmationSpy).toHaveBeenCalledWith(
      "Delete option",
      jasmine.stringContaining(
        `The option is still used in 2 ${TestEntity.label} records.`,
      ),
      jasmine.any(Array),
    );

    entityMapper.delete(m1);
    entityMapper.delete(m2);

    await component.delete(male, genders.indexOf(male));

    expect(confirmationSpy).toHaveBeenCalledWith(
      "Delete option",
      `Are you sure that you want to delete the option "${male.label}"?`,
      jasmine.any(Array),
    );
  });

  it("should set newOptionInput with pasted multiline text and prevent default paste", () => {
    const pastedText = "Option A\nOption B\nOption C";

    const clipboardData = {
      getData: jasmine.createSpy("getData").and.returnValue(pastedText),
    };

    const preventDefaultSpy = jasmine.createSpy("preventDefault");

    const fakeEvent = {
      clipboardData: clipboardData,
      preventDefault: preventDefaultSpy,
    } as unknown as ClipboardEvent;

    component.onPasteNewOption(fakeEvent);

    expect(clipboardData.getData).toHaveBeenCalledWith("text");
    expect(component.newOptionInput).toBe("Option A\nOption B\nOption C");
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("should not prevent default if pasted text is a single line", () => {
    const pastedText = "Single Option";

    const clipboardData = {
      getData: jasmine.createSpy("getData").and.returnValue(pastedText),
    };

    const preventDefaultSpy = jasmine.createSpy("preventDefault");

    const fakeEvent = {
      clipboardData: clipboardData,
      preventDefault: preventDefaultSpy,
    } as unknown as ClipboardEvent;

    // Set initial value
    component.newOptionInput = "existing text";

    component.onPasteNewOption(fakeEvent);

    // Should remain unchanged for single line paste
    expect(component.newOptionInput).toBe("existing text");
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("should create multiple enum values when multiline text is pasted and then createNewOption is called", async () => {
    const pastedText = "Option A\nOption B\nOption C";
    
    const clipboardData = {
      getData: () => pastedText,
    };
    
    const fakeEvent = {
      clipboardData: clipboardData,
      preventDefault: jasmine.createSpy("preventDefault"),
    } as unknown as ClipboardEvent;
    
    const initialCount = component.localEnum.values.length;
    
    // Simulate paste
    component.onPasteNewOption(fakeEvent);
    
    // Then create options
    await component.createNewOption();
    
    expect(component.localEnum.values.length).toBe(initialCount + 3);
    expect(component.localEnum.values.some(v => v.label === "Option A")).toBe(true);
    expect(component.localEnum.values.some(v => v.label === "Option B")).toBe(true);
    expect(component.localEnum.values.some(v => v.label === "Option C")).toBe(true);
    expect(component.newOptionInput).toBe(""); // should be cleared
  });

  it("should add a single option from single-line newOptionInput", async () => {
    component.newOptionInput = "Single Option";
    component.localEnum.values = [];

    await component.createNewOption();

    expect(component.localEnum.values.length).toBe(1);
    expect(component.localEnum.values[0].label).toBe("Single Option");
  });

  it("should add all options from multi-line newOptionInput", async () => {
    component.newOptionInput = "Option A\nOption B\nOption C";
    component.localEnum.values = [];

    await component.createNewOption();

    const labels = component.localEnum.values.map((v) => v.label);
    expect(labels).toEqual(["Option A", "Option B", "Option C"]);
  });

  it("should add only unique options when pasted text includes multiple duplicates (case-insensitive)", async () => {
    component.newOptionInput = `
      Option A
      option b
      Option A
      OPTION C
      option b
      Option D
      OPTION c
    `.trim();

    component.localEnum.values = [];

    await component.createNewOption();

    const labels = component.localEnum.values.map((v) => v.label);
    expect(labels).toContain("Option A");
    expect(labels).toContain("option b");
    expect(labels).toContain("OPTION C");
    expect(labels).toContain("Option D");
    expect(labels.length).toBe(4);
  });

  it("should show correct message when duplicates are skipped", async () => {
    // Pre-existing enum values
    component.localEnum.addOption("Apple");
    component.localEnum.addOption("Banana");

    const snackSpy = spyOn(component['snackBar'], 'open');

    // Simulate user pasting with only 2 duplicates and 2 new items
    component.newOptionInput = `
      Apple
      Orange
      Banana
      Grape
    `.trim();

    await component.createNewOption();

    const labels = component.localEnum.values.map(v => v.label);
    expect(labels).toContain("Apple");
    expect(labels).toContain("Banana");
    expect(labels).toContain("Orange");
    expect(labels).toContain("Grape");
    expect(labels.length).toBe(4);

    expect(snackSpy).toHaveBeenCalledWith(
      jasmine.stringMatching(/Skipped 2 duplicate/),
      undefined,
      jasmine.any(Object)
    );
  });
});