import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { ConfirmationDialogService } from "../confirmation-dialog/confirmation-dialog.service";
import { EntityFormService } from "../entity-form/entity-form.service";
import { EditTextWithAutocompleteComponent } from "./edit-text-with-autocomplete.component";

describe("EditTextWithAutocompleteComponent", () => {
  let component: EditTextWithAutocompleteComponent;
  let fixture: ComponentFixture<EditTextWithAutocompleteComponent>;
  let loadTypeSpy: jasmine.Spy;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(waitForAsync(async () => {
    mockConfirmationDialog = jasmine.createSpyObj(["getConfirmation"]);
    TestBed.configureTestingModule({
      imports: [
        EditTextWithAutocompleteComponent,
        MockedTestingModule.withState(),
      ],
      providers: [
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTextWithAutocompleteComponent);
    component = fixture.componentInstance;
    loadTypeSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
    loadTypeSpy.and.resolveTo([]);
    const entityFormService = TestBed.inject(EntityFormService);
    const entityForm = await entityFormService.createEntityForm(
      [{ id: "name" }, { id: "other" }, { id: "ref" }, { id: "refMixed" }],
      new TestEntity(),
    );

    const nameControl = entityForm.formGroup.get("name") as FormControl<string>;
    component.ngControl = {
      control: nameControl,
    } as any;

    component.formFieldConfig = {
      id: "name",
      additional: {
        entityType: "TestEntity",
      },
    };

    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show all entities of the given type", async () => {
    const e1 = TestEntity.create("First Entity");
    const e2 = TestEntity.create("Second Entity");
    const e3 = TestEntity.create("Third Entity");
    loadTypeSpy.and.resolveTo([e1, e2, e3]);

    await component.ngOnInit();

    expect(component.entities).toEqual([e1, e2, e3]);
  });

  it("should filter entities when searching", async () => {
    const e1 = TestEntity.create("First Entity");
    const e2 = TestEntity.create("Second Entity");
    const e3 = TestEntity.create("Third Entity");
    loadTypeSpy.and.resolveTo([e1, e2, e3]);

    await component.ngOnInit();
    component.formControl.setValue("Second");
    component.updateAutocomplete();

    expect(component.autocompleteEntities.value).toEqual([e2]);
  });

  it("should correctly set the form controls to the selected entity's values", async () => {
    const e1 = TestEntity.create({
      name: "First Entity",
      other: "some value",
      ref: "user1",
      refMixed: ["group1", "group2"],
    });
    loadTypeSpy.and.resolveTo([e1]);
    await component.ngOnInit();

    await component.selectEntity(e1);

    expect(component.formControl.value).toEqual(e1.name);
    expect(component.parent.get("other").value).toEqual(e1.other);
    expect(component.parent.get("ref").value).toEqual(e1.ref);
    expect(component.parent.get("refMixed").value).toEqual(e1.refMixed);
  });

  it("should correctly reset the form to its original values", async () => {
    const e1 = TestEntity.create({
      name: "First Entity",
      other: "some value",
      ref: "user1",
      refMixed: ["group1", "group2"],
      category: { id: "test", label: "Test" },
    });
    loadTypeSpy.and.resolveTo([e1]);
    component.parent.get("refMixed").setValue(["testgroup1"]);
    await component.ngOnInit();
    await component.selectEntity(e1);

    await component.resetForm();

    expect(component.formControl.value).toBeFalsy();
    expect(component.parent.get("other").value).toEqual(null);
    expect(component.parent.get("ref").value).toEqual(null);
    expect(component.parent.get("refMixed").value).toEqual(["testgroup1"]);
    expect(component.parent.get("category")).toBeFalsy();
  });

  it("should link the given parent entity's ID in the form control of the relevant property", async () => {
    const parentEntity = new TestEntity();

    const e1 = TestEntity.create({
      name: "First Entity",
      refMixed: ["group1", "group2"],
    });
    loadTypeSpy.and.resolveTo([e1]);
    component.additional.relevantProperty = "refMixed";
    component.additional.relatedEntitiesParent = parentEntity;
    await component.ngOnInit();

    await component.selectEntity(e1);

    expect(component.parent.get("refMixed").value).toContain(
      parentEntity.getId(),
    );
  });

  it("should initialize undefined relevantProperty field and add the relevant value", async () => {
    const parentEntity = new TestEntity();

    const e1 = TestEntity.create("First Entity");
    delete e1.refMixed;
    loadTypeSpy.and.resolveTo([e1]);
    component.additional.relevantProperty = "refMixed";
    component.additional.relatedEntitiesParent = parentEntity;
    await component.ngOnInit();

    await component.selectEntity(e1);

    expect(e1.refMixed).toEqual([parentEntity.getId()]);
    expect(component.parent.get("refMixed").value).toEqual([
      parentEntity.getId(),
    ]);
  });

  it("should show name of the selected entity", async () => {
    const e1 = TestEntity.create("First Entity");
    const e2 = TestEntity.create("Second Entity");
    component.formControl.setValue(e1.name);
    loadTypeSpy.and.resolveTo([e1, e2]);

    await component.ngOnInit();

    fixture.detectChanges();
    const input: HTMLInputElement = fixture.debugElement.query(
      By.css("input"),
    ).nativeElement;
    expect(input.value).toEqual("First Entity");
  });

  // check if values in the form control have been manually changed after loading the entity
  it("should only load new entity if user confirms to override changes", async () => {
    const e1 = TestEntity.create({
      name: "First Entity",
      other: "some value",
      ref: "user1",
      refMixed: ["group1", "group2"],
    });
    const e2 = TestEntity.create("Second Entity");
    loadTypeSpy.and.resolveTo([e1, e2]);
    mockConfirmationDialog.getConfirmation.and.resolveTo(true);

    await component.ngOnInit();
    component.formControl.setValue("test1");
    component.parent.get("ref").setValue("user3");

    await component.selectEntity(e2);

    expect(component.selectedEntity).toEqual(e2);
  });
});
