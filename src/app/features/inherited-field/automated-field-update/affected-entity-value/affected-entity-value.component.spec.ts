import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, FormGroup } from "@angular/forms";
import { EntityFormService } from "#src/app/core/common-components/entity-form/entity-form.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import type { DialogRow } from "../automated-field-update.component";
import { AffectedEntityValueComponent } from "./affected-entity-value.component";

describe("AffectedEntityValueComponent", () => {
  let fixture: ComponentFixture<AffectedEntityValueComponent>;
  let createEntityForm: ReturnType<typeof vi.fn>;
  let control: FormControl;
  let emitted: unknown[];

  /** the database format holds ids, the entity format objects with the id */
  const toEntityFormat = (ids: string[]) => ids.map((id) => ({ id }));

  function row(value: string[]): DialogRow {
    return {
      id: "Entity:1",
      newValue: value,
      value,
      targetFieldId: "tags",
      targetEntityType: Entity,
      affectedEntity: new Entity("1"),
      relatedReferenceField: "parent",
      edited: false,
      suggestionChanged: false,
    };
  }

  beforeEach(async () => {
    control = new FormControl();
    createEntityForm = vi.fn().mockResolvedValue({
      formGroup: new FormGroup({ tags: control }),
    });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EntityFormService,
          useValue: {
            extendFormFieldConfig: (id: string) => ({ id }),
            createEntityForm,
          },
        },
        {
          provide: EntitySchemaService,
          useValue: {
            valueToEntityFormat: toEntityFormat,
            valueToDatabaseFormat: (values: { id: string }[]) =>
              values.map((value) => value.id),
          },
        },
      ],
    });
    TestBed.overrideComponent(AffectedEntityValueComponent, {
      set: { imports: [], template: "" },
    });
    fixture = TestBed.createComponent(AffectedEntityValueComponent);
    fixture.componentRef.setInput("row", row(["a"]));
    emitted = [];
    fixture.componentInstance.valueChange.subscribe((value) =>
      emitted.push(value),
    );
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("should create the form without default value handling, which only queries linked records for the hidden inherit button", () => {
    // forTable, withPermissionCheck, withDefaultValues
    expect(createEntityForm.mock.calls[0].slice(3)).toEqual([
      false,
      true,
      false,
    ]);
    expect(control.value).toEqual(toEntityFormat(["a"]));
  });

  it("should report the value the user enters in database format", () => {
    control.setValue(toEntityFormat(["a", "b"]));

    expect(emitted).toEqual([["a", "b"]]);
  });

  it("should keep the field config for a new row of the same field, as a new config rebuilds the edit component", () => {
    const field = fixture.componentInstance.field();

    fixture.componentRef.setInput("row", row(["c"]));

    expect(fixture.componentInstance.field()).toBe(field);
  });

  it("should show a new value without reporting it as a change of the user", async () => {
    fixture.componentRef.setInput("row", row(["c"]));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(control.value).toEqual(toEntityFormat(["c"]));
    expect(emitted).toEqual([]);
  });
});
