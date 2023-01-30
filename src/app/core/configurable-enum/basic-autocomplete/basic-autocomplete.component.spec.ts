import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { BasicAutocompleteComponent } from "./basic-autocomplete.component";
import { School } from "../../../child-dev-project/schools/model/school";
import { Child } from "../../../child-dev-project/children/model/child";
import { By } from "@angular/platform-browser";
import { SimpleChange } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { FormControl } from "@angular/forms";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("BasicAutocompleteComponent", () => {
  let component: BasicAutocompleteComponent<any, any>;
  let fixture: ComponentFixture<BasicAutocompleteComponent<any, any>>;

  const entityToId = (e: Entity) => e?.getId();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BasicAutocompleteComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BasicAutocompleteComponent);
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
    expect(component.autocompleteSuggestedOptions.value).toEqual([
      school1,
      school2,
      school3,
    ] as any);
    component.updateAutocomplete("Aa");
    expect(component.autocompleteSuggestedOptions.value).toEqual([
      school1,
      school2,
    ] as any);
    component.updateAutocomplete("Aab");
    expect(component.autocompleteSuggestedOptions.value).toEqual([
      school2,
    ] as any);
  });

  it("should show name of the selected entity", fakeAsync(() => {
    const child1 = Child.create("First Child");
    const child2 = Child.create("Second Child");
    component.form.setValue(child1.getId());
    component.options = [child1, child2];
    component.valueMapper = entityToId;

    component.ngOnChanges({
      form: new SimpleChange(null, component.form, false),
      options: new SimpleChange(null, component.options, false),
    });
    tick();
    fixture.detectChanges();

    expect(component.inputValue).toBe(child1 as any);
    expect(
      fixture.debugElement.query(By.css("#inputElement")).nativeElement.value
    ).toEqual("First Child");
  }));

  it("Should have the correct entity selected when it's name is entered", () => {
    const child1 = Child.create("First Child");
    const child2 = Child.create("Second Child");
    component.options = [child1, child2];
    component.valueMapper = entityToId;

    component.select("First Child");

    expect(component.inputValue).toBe(child1 as any);
    expect(component.form.value).toBe(child1.getId());
  });

  it("Should unselect if no entity can be matched", () => {
    const first = Child.create("First");
    const second = Child.create("Second");
    component.options = [first, second];
    component.valueMapper = entityToId;

    component.select(first as any);
    expect(component.inputValue).toBe(first as any);
    expect(component.form.value).toBe(first.getId());

    component.select("second");
    expect(component.inputValue).toBe(second as any);
    expect(component.form.value).toBe(second.getId());

    component.select("NonExistent");
    expect(component.inputValue).toBe(undefined);
    expect(component.form.value).toBe(undefined);
  });
});
