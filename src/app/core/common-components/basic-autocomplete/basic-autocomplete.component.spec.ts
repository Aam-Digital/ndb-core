import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";

import { BasicAutocompleteComponent } from "./basic-autocomplete.component";
import { School } from "../../../child-dev-project/schools/model/school";
import { Child } from "../../../child-dev-project/children/model/child";
import { Entity } from "../../entity/model/entity";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatDialogModule } from "@angular/material/dialog";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { HarnessLoader } from "@angular/cdk/testing";
import { MatAutocompleteHarness } from "@angular/material/autocomplete/testing";
import {
  FormControl,
  FormGroup,
  NgControl,
  NgForm,
  Validators,
} from "@angular/forms";
import { genders } from "../../../child-dev-project/children/model/genders";
import { ConfirmationDialogService } from "../confirmation-dialog/confirmation-dialog.service";

describe("BasicAutocompleteComponent", () => {
  let component: BasicAutocompleteComponent<any, any>;
  let fixture: ComponentFixture<BasicAutocompleteComponent<any, any>>;
  let loader: HarnessLoader;
  let testControl: FormControl;
  const entityToId = (e: Entity) => e?.getId();

  beforeEach(async () => {
    testControl = new FormControl("");
    const formGroup = new FormGroup({ testControl });
    await TestBed.configureTestingModule({
      imports: [
        BasicAutocompleteComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
        MatDialogModule,
      ],
      providers: [{ provide: NgForm, useValue: formGroup }],
    })
      .overrideComponent(BasicAutocompleteComponent, {
        // overwrite @Self dependency
        add: {
          providers: [
            { provide: NgControl, useValue: { control: testControl } },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BasicAutocompleteComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should correctly show the autocomplete values", async () => {
    const school1 = School.create({ name: "Aaa" });
    const school2 = School.create({ name: "aab" });
    const school3 = School.create({ name: "cde" });
    component.options = [school1, school2, school3];
    let currentAutocompleteSuggestions: School[];
    component.autocompleteSuggestedOptions.subscribe(
      (value) => (currentAutocompleteSuggestions = value.map((o) => o.asValue)),
    );

    component.autocompleteForm.setValue("");
    expect(currentAutocompleteSuggestions).toEqual([school1, school2, school3]);
    component.autocompleteForm.setValue("Aa");
    expect(currentAutocompleteSuggestions).toEqual([school1, school2]);
    component.autocompleteForm.setValue("Aab");
    expect(currentAutocompleteSuggestions).toEqual([school2]);
  });

  it("should show name of the selected entity", async () => {
    const child1 = Child.create("First Child");
    const child2 = Child.create("Second Child");
    component.value = child1.getId();
    component.options = [child1, child2];
    component.valueMapper = entityToId;

    component.ngOnChanges({ value: true, options: true, valueMapper: true });
    fixture.detectChanges();

    expect(component.displayText).toBe("First Child");
  });

  it("should have the correct entity selected when it's name is entered", () => {
    const child1 = Child.create("First Child");
    const child2 = Child.create("Second Child");
    component.options = [child1, child2];
    component.valueMapper = entityToId;

    component.select({ asValue: child1.getId() } as any);

    expect(component.value).toBe(child1.getId());
  });

  it("should reset if leaving empty autocomplete", fakeAsync(() => {
    const first = Child.create("First");
    const second = Child.create("Second");
    component.options = [first, second];
    component.valueMapper = entityToId;

    component.select({ asValue: first.getId() } as any);
    expect(component.value).toBe(first.getId());

    component.autocompleteForm.setValue("");
    component.onFocusOut({} as any);
    tick(200);

    expect(component.value).toBe(undefined);
    flush();
  }));

  it("should disable the form if the control is disabled", () => {
    component.disabled = false;
    expect(component.autocompleteForm.disabled).toBeFalse();
    component.disabled = true;
    expect(component.autocompleteForm.disabled).toBeTrue();
  });

  it("should initialize the options in multi select mode", async () => {
    const autocomplete = await loader.getHarness(MatAutocompleteHarness);
    component.options = [0, 1, 2];
    component.multi = true;
    component.value = [0, 1];
    component.ngOnChanges({ options: true, value: true });

    component.showAutocomplete();
    component.autocomplete.openPanel();
    const options = await autocomplete.getOptions();
    expect(options).toHaveSize(3);

    await options[2].click();
    // When browser is not in foreground, this doesn't happen automatically
    component.autocomplete.openPanel();
    fixture.detectChanges();
    await options[1].click();

    expect(component.value).toEqual([0, 2]);
  });

  it("should switch the input when focusing in multi select mode", fakeAsync(() => {
    component.multi = true;
    component.options = ["some", "values", "and", "other", "options"];
    component.value = ["some", "values"];
    component.ngOnChanges({ value: true, options: true });
    expect(component.displayText).toBe("some, values");

    component.showAutocomplete();
    expect(component.autocompleteForm).toHaveValue("");
    expect(component.focused).toBeTrue();

    component.onFocusOut({} as any);
    tick(200);

    expect(component.displayText).toBe("some, values");
    expect(component.focused).toBeFalse();
  }));

  it("should update the error state if the form is invalid", () => {
    testControl.setValidators([Validators.required]);
    testControl.setValue(null);
    component.ngDoCheck();

    expect(component.errorState).toBeFalse();

    testControl.markAsTouched();
    component.ngDoCheck();

    expect(component.errorState).toBeTrue();
  });

  it("should create new option", fakeAsync(() => {
    const newOption = "new option";
    const confirmationSpy = spyOn(
      TestBed.inject<ConfirmationDialogService>(ConfirmationDialogService),
      "getConfirmation",
    );
    component.createOption = (id) => ({ id: id, label: id });
    const createOptionEventSpy = spyOn(
      component,
      "createOption",
    ).and.callThrough();
    component.options = genders;
    const initialValue = genders[0].id;
    component.value = initialValue;
    component.valueMapper = (o) => o.id;

    component.ngOnChanges({ value: true, options: true, valueMapper: true });

    component.showAutocomplete();
    component.autocompleteForm.setValue(newOption);

    // decline confirmation for new option
    confirmationSpy.and.resolveTo(false);
    component.select(newOption);

    tick();
    expect(confirmationSpy).toHaveBeenCalled();
    expect(createOptionEventSpy).not.toHaveBeenCalled();
    expect(component.value).toEqual(initialValue);

    // confirm new option
    confirmationSpy.calls.reset();
    confirmationSpy.and.resolveTo(true);
    component.select(newOption);

    tick();
    expect(confirmationSpy).toHaveBeenCalled();
    expect(createOptionEventSpy).toHaveBeenCalledWith(newOption);
    expect(component.value).toEqual(newOption);
  }));
});
