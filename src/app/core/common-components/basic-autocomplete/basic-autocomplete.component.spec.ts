import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";

import { BasicAutocompleteComponent } from "./basic-autocomplete.component";
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
import { TestEntity } from "../../../utils/test-utils/TestEntity";

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
    const school1 = TestEntity.create({ name: "Aaa" });
    const school2 = TestEntity.create({ name: "aab" });
    const school3 = TestEntity.create({ name: "cde" });
    component.options = [school1, school2, school3];
    let currentAutocompleteSuggestions: TestEntity[];
    component.autocompleteSuggestedOptions.subscribe(
      (value) => (currentAutocompleteSuggestions = value.map((o) => o.initial)),
    );

    component.autocompleteForm.setValue("");
    expect(currentAutocompleteSuggestions).toEqual([school1, school2, school3]);
    component.autocompleteForm.setValue("Aa");
    expect(currentAutocompleteSuggestions).toEqual([school1, school2]);
    component.autocompleteForm.setValue("Aab");
    expect(currentAutocompleteSuggestions).toEqual([school2]);
  });

  it("should show name of the selected entity", async () => {
    const child1 = TestEntity.create("First Child");
    const child2 = TestEntity.create("Second Child");
    component.value = child1.getId();
    component.options = [child1, child2];
    component.valueMapper = entityToId;

    component.ngOnChanges({ value: true, options: true, valueMapper: true });
    fixture.detectChanges();

    expect(component.displayText).toBe("First Child");
  });

  it("should use _id and _label as default display/value for options", async () => {
    const option1 = { _id: "1", _label: "First" };
    const option2 = { _id: "2", _label: "Second" };
    component.options = [option1, option2];

    component.ngOnChanges({ options: true });
    fixture.detectChanges();

    // @ts-ignore
    expect(component._options).toEqual([
      jasmine.objectContaining({
        asValue: "1",
        asString: "First",
        initial: option1,
      }),
      jasmine.objectContaining({
        asValue: "2",
        asString: "Second",
        initial: option2,
      }),
    ]);
  });

  it("should have the correct entity selected when it's name is entered", () => {
    const child1 = TestEntity.create("First Child");
    const child2 = TestEntity.create("Second Child");
    component.options = [child1, child2];
    component.valueMapper = entityToId;

    component.select({ asValue: child1.getId() } as any);

    expect(component.value).toBe(child1.getId());
  });

  it("should reset if leaving empty autocomplete", fakeAsync(() => {
    const first = TestEntity.create("First");
    const second = TestEntity.create("Second");
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
    expect(options).toHaveSize(
      3 +
        // includes a hidden option to enable footer display within the autocomplete panel
        1,
    );

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
    expect(component.isInSearchMode()).toBeTrue();

    component.onFocusOut({} as any);
    tick(200);

    expect(component.displayText).toBe("some, values");
    expect(component.isInSearchMode()).toBeFalse();
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
    const createOptionMock = jasmine.createSpy();

    component.createOption = createOptionMock;
    const newOption = "new option";
    component.options = genders;
    const initialValue = genders[0].id;
    component.value = initialValue;
    component.valueMapper = (o) => o.id;

    component.ngOnChanges({ value: true, options: true, valueMapper: true });

    component.showAutocomplete();
    component.autocompleteForm.setValue(newOption);

    // decline creating new option
    createOptionMock.and.resolveTo(undefined);
    component.select(newOption);

    tick();
    expect(createOptionMock).toHaveBeenCalled();
    expect(component.value).toEqual(initialValue);

    // successfully add new option
    createOptionMock.calls.reset();
    createOptionMock.and.resolveTo({ id: newOption, label: newOption });
    component.select(newOption);

    tick();
    expect(createOptionMock).toHaveBeenCalled();
    expect(component.value).toEqual(newOption);
  }));
});
