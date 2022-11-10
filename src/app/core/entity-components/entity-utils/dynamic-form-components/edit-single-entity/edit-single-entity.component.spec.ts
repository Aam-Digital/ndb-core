import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { EditSingleEntityComponent } from "./edit-single-entity.component";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { EntityFormService } from "../../../entity-form/entity-form.service";
import { ChildSchoolRelation } from "../../../../../child-dev-project/children/model/childSchoolRelation";
import { School } from "../../../../../child-dev-project/schools/model/school";
import { EntityUtilsModule } from "../../entity-utils.module";
import { Child } from "../../../../../child-dev-project/children/model/child";
import { MockedTestingModule } from "../../../../../utils/mocked-testing.module";
import { FormControl } from "@angular/forms";

describe("EditSingleEntityComponent", () => {
  let component: EditSingleEntityComponent;
  let fixture: ComponentFixture<EditSingleEntityComponent>;
  let loadTypeSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityUtilsModule, MockedTestingModule.withState()],
    }).compileComponents();
    loadTypeSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSingleEntityComponent);
    component = fixture.componentInstance;
    const entityFormService = TestBed.inject(EntityFormService);
    component.parent = entityFormService.createFormGroup(
      [{ id: "schoolId" }],
      new ChildSchoolRelation()
    );
    component.formControl = component.parent.get(
      "schoolId"
    ) as FormControl<string>;
    component.formControlName = "schoolId";
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show all entities of the given type", fakeAsync(() => {
    const school1 = School.create({ name: "First School" });
    const school2 = School.create({ name: "Second School " });
    loadTypeSpy.and.resolveTo([school1, school2]);

    initComponent();
    tick();

    expect(loadTypeSpy).toHaveBeenCalled();
    expect(component.entities).toEqual([school1, school2]);
    component.updateAutocomplete("");
    expect(component.autocompleteEntities.value).toEqual([school1, school2]);
  }));

  it("should correctly show the autocomplete values", () => {
    const school1 = School.create({ name: "Aaa" });
    const school2 = School.create({ name: "aab" });
    const school3 = School.create({ name: "cde" });
    component.entities = [school1, school2, school3];

    component.updateAutocomplete("");
    expect(component.autocompleteEntities.value).toEqual([
      school1,
      school2,
      school3,
    ]);
    component.updateAutocomplete("Aa");
    expect(component.autocompleteEntities.value).toEqual([school1, school2]);
    component.updateAutocomplete("Aab");
    expect(component.autocompleteEntities.value).toEqual([school2]);
  });

  it("should show name of the selected entity", fakeAsync(() => {
    const child1 = Child.create("First Child");
    const child2 = Child.create("Second Child");
    component.formControl.setValue(child1.getId());
    loadTypeSpy.and.resolveTo([child1, child2]);

    initComponent();
    tick();
    fixture.detectChanges();

    expect(component.selectedEntity).toBe(child1);
    expect(component.input.nativeElement.value).toEqual("First Child");
  }));

  it("Should have the correct entity selected when it's name is entered", () => {
    const child1 = Child.create("First Child");
    const child2 = Child.create("Second Child");
    component.entities = [child1, child2];

    component.select("First Child");

    expect(component.selectedEntity).toBe(child1);
    expect(component.formControl).toHaveValue(child1.getId());
  });

  it("Should unselect if no entity can be matched", () => {
    const first = Child.create("First");
    const second = Child.create("Second");
    component.entities = [first, second];

    component.select(first);
    expect(component.selectedEntity).toBe(first);
    expect(component.formControl.value).toBe(first.getId());

    component.select("second");
    expect(component.selectedEntity).toBe(second);
    expect(component.formControl.value).toBe(second.getId());

    component.select("NonExistent");
    expect(component.selectedEntity).toBe(undefined);
    expect(component.formControl.value).toBe(undefined);
  });

  function initComponent(): Promise<any> {
    return component.onInitFromDynamicConfig({
      formFieldConfig: { id: "childId" },
      formControl: component.formControl,
      propertySchema: ChildSchoolRelation.schema.get("childId"),
    });
  }
});
