import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { EntityInlineEditActionsComponent } from "./entity-inline-edit-actions.component";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { genders } from "../../../../child-dev-project/children/model/genders";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { AlertService } from "../../../alerts/alert.service";
import { mockEntityMapper } from "../../../entity/entity-mapper/mock-entity-mapper-service";
import { CurrentUserSubject } from "../../../session/current-user-subject";
import { of } from "rxjs";
import { EntityActionsService } from "../../../entity/entity-actions/entity-actions.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { CoreTestingModule } from "../../../../utils/core-testing.module";
import { DatabaseEntity } from "../../../entity/database-entity.decorator";
import { Entity } from "../../../entity/model/entity";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { ConfigurableEnumValue } from "../../../basic-datatypes/configurable-enum/configurable-enum.interface";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("EntityInlineEditActionsComponent", () => {
  let component: EntityInlineEditActionsComponent<InlineEditEntity>;
  let fixture: ComponentFixture<
    EntityInlineEditActionsComponent<InlineEditEntity>
  >;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EntityInlineEditActionsComponent,
        CoreTestingModule,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        { provide: CurrentUserSubject, useValue: of(null) },
        { provide: EntityActionsService, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent<
      EntityInlineEditActionsComponent<InlineEditEntity>
    >(EntityInlineEditActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should create a formGroup when editing a row", async () => {
    const child = new InlineEditEntity();
    child.name = "Child Name";
    child.projectNumber = "01";
    component.row = { record: child };

    await component.edit();

    const formGroup = component.row.formGroup;
    expect(formGroup.get("name")).toHaveValue("Child Name");
    expect(formGroup.get("projectNumber")).toHaveValue("01");
    expect(formGroup).toBeEnabled();
  });

  it("should correctly save changes to an entity", fakeAsync(async () => {
    spyOn(TestBed.inject(EntityAbility), "can").and.returnValue(true);
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "save").and.resolveTo();
    const fb = TestBed.inject(UntypedFormBuilder);
    const child = new InlineEditEntity();
    child.name = "Old Name";

    const entityFormService = TestBed.inject(EntityFormService);
    const entityForm = await entityFormService.createEntityForm(
      ["name", "gender"],
      child,
    );

    const formGroup = fb.group({
      name: "New Name",
      gender: genders[2],
    });
    entityForm.formGroup = formGroup;

    component.form = entityForm;
    component.row = { record: child, formGroup: formGroup };

    component.save();
    tick();

    expect(entityMapper.save).toHaveBeenCalledWith(component.row.record);
    expect(component.row.record.name).toBe("New Name");
    expect(component.row.record.gender).toBe(genders[2]);
    expect(component.row.formGroup).toBeUndefined();
  }));

  it("should show a error message when saving fails", fakeAsync(() => {
    const entityFormService = TestBed.inject(EntityFormService);
    spyOn(entityFormService, "saveChanges").and.rejectWith(
      new Error("Form invalid"),
    );
    const alertService = TestBed.inject(AlertService);
    spyOn(alertService, "addDanger");

    component.row = { formGroup: null, record: new InlineEditEntity() };
    component.save();
    tick();

    expect(alertService.addDanger).toHaveBeenCalledWith("Form invalid");
  }));

  it("should clear the form group when resetting", () => {
    component.row = {
      record: new InlineEditEntity(),
      formGroup: new UntypedFormGroup({}),
    };

    component.resetChanges();

    expect(component.row.formGroup).toBeFalsy();
  });
});

@DatabaseEntity("InlineEditEntity")
class InlineEditEntity extends Entity {
  @DatabaseField() name: string;
  @DatabaseField() projectNumber: string;
  @DatabaseField({ dataType: "configurable-enum", additional: "genders" })
  gender: ConfigurableEnumValue;
}
