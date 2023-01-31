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
import { FormControl } from "@angular/forms";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatDialogModule } from "@angular/material/dialog";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { HarnessLoader } from "@angular/cdk/testing";
import { MatInputHarness } from "@angular/material/input/testing";

describe("BasicAutocompleteComponent", () => {
  let component: BasicAutocompleteComponent<any, any>;
  let fixture: ComponentFixture<BasicAutocompleteComponent<any, any>>;
  let loader: HarnessLoader;

  const entityToId = (e: Entity) => e?.getId();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BasicAutocompleteComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
        MatDialogModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BasicAutocompleteComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    component.form = new FormControl();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should correctly show the autocomplete values", () => {
    const school1 = School.create({ name: "Aaa" });
    const school2 = School.create({ name: "aab" });
    const school3 = School.create({ name: "cde" });
    component.options = [school1, school2, school3];

    component.updateAutocomplete("");
    expect(getAutocompleteOptions()).toEqual([school1, school2, school3]);
    component.updateAutocomplete("Aa");
    expect(getAutocompleteOptions()).toEqual([school1, school2]);
    component.updateAutocomplete("Aab");
    expect(getAutocompleteOptions()).toEqual([school2]);
  });

  it("should show name of the selected entity", async () => {
    const child1 = Child.create("First Child");
    const child2 = Child.create("Second Child");
    component._form.setValue(child1.getId());
    component.options = [child1, child2];
    component.valueMapper = entityToId;

    component.ngOnChanges({ form: true, options: true } as any);
    fixture.detectChanges();

    expect(component.autocompleteForm).toHaveValue("First Child");
    const inputElement = await loader.getHarness(MatInputHarness);
    await expectAsync(inputElement.getValue()).toBeResolvedTo("First Child");
  });

  it("Should have the correct entity selected when it's name is entered", () => {
    const child1 = Child.create("First Child");
    const child2 = Child.create("Second Child");
    component.options = [child1, child2];
    component.valueMapper = entityToId;

    component.select({ asValue: child1.getId() } as any);

    expect(component._form.value).toBe(child1.getId());
  });

  it("should reset if nothing has been selected", fakeAsync(() => {
    const first = Child.create("First");
    const second = Child.create("Second");
    component.options = [first, second];
    component.valueMapper = entityToId;

    component.select({ asValue: first.getId() } as any);
    expect(component._form.value).toBe(first.getId());

    component.resetIfInvalidOption("Non existent");
    tick();

    expect(component._form.value).toBe(first.getId());
    flush();
  }));

  function getAutocompleteOptions() {
    return component.autocompleteSuggestedOptions.value.map((o) => o.asValue);
  }
});
