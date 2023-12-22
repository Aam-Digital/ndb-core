import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { EntityInlineEditActionsComponent } from "./entity-inline-edit-actions.component";
import { Child } from "../../../../child-dev-project/children/model/child";
import { TableRow } from "../entities-table.component";
import { Entity } from "../../../entity/model/entity";
import { ScreenWidthObserver } from "../../../../utils/media/screen-size-observer.service";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { genders } from "../../../../child-dev-project/children/model/genders";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { AlertService } from "../../../alerts/alert.service";

describe("EntityInlineEditActionsComponent", () => {
  let component: EntityInlineEditActionsComponent;
  let fixture: ComponentFixture<EntityInlineEditActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityInlineEditActionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityInlineEditActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should create a formGroup when editing a row", () => {
    const child = new Child();
    child.name = "Child Name";
    child.projectNumber = "01";
    const tableRow: TableRow<Entity> = { record: child };
    const media = TestBed.inject(ScreenWidthObserver);
    spyOn(media, "isDesktop").and.returnValue(true);

    component.edit(tableRow);

    const formGroup = tableRow.formGroup;
    expect(formGroup.get("name")).toHaveValue("Child Name");
    expect(formGroup.get("projectNumber")).toHaveValue("01");
    expect(formGroup).toBeEnabled();
  });

  it("should correctly save changes to an entity", fakeAsync(() => {
    TestBed.inject(EntityAbility).update([
      { subject: "Child", action: "create" },
    ]);
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "save").and.resolveTo();
    const fb = TestBed.inject(UntypedFormBuilder);
    const child = new Child();
    child.name = "Old Name";
    const formGroup = fb.group({
      name: "New Name",
      gender: genders[2],
    });
    const tableRow = { record: child, formGroup: formGroup };

    component.save(tableRow);
    tick();

    expect(entityMapper.save).toHaveBeenCalledWith(tableRow.record);
    expect(tableRow.record.name).toBe("New Name");
    expect(tableRow.record.gender).toBe(genders[2]);
    expect(tableRow.formGroup).not.toBeEnabled();
  }));

  it("should show a error message when saving fails", fakeAsync(() => {
    const entityFormService = TestBed.inject(EntityFormService);
    spyOn(entityFormService, "saveChanges").and.rejectWith(
      new Error("Form invalid"),
    );
    const alertService = TestBed.inject(AlertService);
    spyOn(alertService, "addDanger");

    component.save({ formGroup: null, record: new Child() });
    tick();

    expect(alertService.addDanger).toHaveBeenCalledWith("Form invalid");
  }));

  it("should clear the form group when resetting", () => {
    const row = { record: new Child(), formGroup: new UntypedFormGroup({}) };

    component.resetChanges(row);

    expect(row.formGroup).toBeFalsy();
  });
});
