import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EventEmitter } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { AdminEmbeddedArrayDataComponent } from "./admin-embedded-array-data.component";
import { AdminEntityService } from "#src/app/core/admin/admin-entity.service";
import {
  DatabaseEntity,
  EntityRegistry,
} from "#src/app/core/entity/database-entity.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import {
  MatDialogMock,
  mockMatDialog,
  mockMatDialogRef,
} from "#src/app/utils/test-utils/dialog-mocks";

@DatabaseEntity("AdminEmbeddedArrayDataTest")
class AdminEmbeddedArrayDataTest extends Entity {}

describe("AdminEmbeddedArrayDataComponent", () => {
  let component: AdminEmbeddedArrayDataComponent;
  let fixture: ComponentFixture<AdminEmbeddedArrayDataComponent>;
  let updateSchemaField: ReturnType<typeof vi.fn>;
  let dialog: MatDialogMock;

  beforeEach(async () => {
    AdminEmbeddedArrayDataTest.schema.set("contactPersons", {
      dataType: "schema-embed-array",
      label: "Contact Persons",
      additional: { role: { dataType: "string", label: "Role" } },
    });
    updateSchemaField = vi.fn();
    dialog = mockMatDialog();

    await TestBed.configureTestingModule({
      imports: [AdminEmbeddedArrayDataComponent],
      providers: [
        EntityRegistry,
        {
          provide: AdminEntityService,
          useValue: {
            entitySchemaUpdated: new EventEmitter<void>(),
            updateSchemaField,
          },
        },
      ],
    })
      .overrideProvider(MatDialog, { useValue: dialog })
      .compileComponents();

    fixture = TestBed.createComponent(AdminEmbeddedArrayDataComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("entityType", AdminEmbeddedArrayDataTest);
    fixture.componentRef.setInput("config", { property: "contactPersons" });
  });

  it.each([
    ["contactPersons", 'Configure field "Contact Persons"'],
    ["missingField", 'The field "missingField" displayed in this section'],
  ])(
    "offers to configure the displayed field only if it exists (property: %s)",
    (property, expectedText) => {
      fixture.componentRef.setInput("config", { property });
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(expectedText);
    },
  );

  it("updates the entity type's schema with the field edited in the dialog", () => {
    const editedField = {
      ...AdminEmbeddedArrayDataTest.schema.get("contactPersons"),
      id: "contactPersons",
      label: "Contacts",
    };
    dialog.open.mockReturnValue(mockMatDialogRef(editedField));

    component.openFieldConfig();

    expect(dialog.open.mock.calls[0][1].data.entitySchemaField).toEqual(
      expect.objectContaining({
        id: "contactPersons",
        label: "Contact Persons",
      }),
    );
    expect(updateSchemaField).toHaveBeenCalledWith(
      AdminEmbeddedArrayDataTest,
      "contactPersons",
      editedField,
    );
  });

  it("keeps the schema if the dialog is cancelled", () => {
    dialog.open.mockReturnValue(mockMatDialogRef(undefined));

    component.openFieldConfig();

    expect(updateSchemaField).not.toHaveBeenCalled();
  });
});
