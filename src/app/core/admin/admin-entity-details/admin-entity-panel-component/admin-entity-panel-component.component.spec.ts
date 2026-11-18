import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminEntityPanelComponentComponent } from "./admin-entity-panel-component.component";
import {
  DatabaseEntity,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { EntityRelationsService } from "app/core/entity/entity-mapper/entity-relations.service";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { EventEmitter } from "@angular/core";
import { Entity } from "app/core/entity/model/entity";
import { DefaultDatatype } from "app/core/entity/default-datatype/default.datatype";
import { SchemaEmbedArrayDatatype } from "app/core/basic-datatypes/schema-embed/schema-embed-array.datatype";
import { AdminEntityService } from "app/core/admin/admin-entity.service";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { PanelComponent } from "app/core/entity-details/EntityDetailsConfig";
import { EmbeddedArrayDataConfig } from "app/core/entity-details/embedded-array-data/embedded-array-data.component";
import { AdminRelatedEntityDetailsComponent } from "../admin-related-entity-details/admin-related-entity-details.component";
import {
  MatDialogMock,
  mockMatDialog,
  mockMatDialogRef,
} from "app/utils/test-utils/dialog-mocks";

@DatabaseEntity("EmbedColumnsPanelTest")
class EmbedColumnsPanelTest extends Entity {}

@DatabaseEntity("EmbedSectionPanelTest")
class EmbedSectionPanelTest extends Entity {}

describe("AdminEntityPanelComponentComponent", () => {
  let component: AdminEntityPanelComponentComponent;
  let fixture: ComponentFixture<AdminEntityPanelComponentComponent>;
  let mockEntityRelationsService: any;
  let entitySchemaUpdated: EventEmitter<void>;
  let updateSchemaField: ReturnType<typeof vi.fn>;
  let dialog: MatDialogMock;

  beforeEach(async () => {
    mockEntityRelationsService = {
      getEntityTypesReferencingType: vi
        .fn()
        .mockReturnValue([])
        .mockName("EntityRelationsService.getEntityTypesReferencingType"),
    };
    entitySchemaUpdated = new EventEmitter<void>();
    updateSchemaField = vi.fn();
    dialog = mockMatDialog();
    await TestBed.configureTestingModule({
      imports: [AdminEntityPanelComponentComponent, MatDialogModule],
      providers: [
        EntityRegistry,
        {
          provide: EntityRelationsService,
          useValue: mockEntityRelationsService,
        },
        {
          provide: AdminEntityService,
          useValue: { entitySchemaUpdated, updateSchemaField },
        },
        {
          provide: DefaultDatatype,
          useClass: SchemaEmbedArrayDatatype,
          multi: true,
        },
      ],
    })
      .overrideProvider(MatDialog, { useValue: dialog })
      .compileComponents();

    fixture = TestBed.createComponent(AdminEntityPanelComponentComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("config", {
      component: "SomeComponent",
    } as any);

    fixture.componentRef.setInput("entityType", { ENTITY_TYPE: "Note" } as any);

    fixture.detectChanges();
  });

  it("should handle undefined columns when creating new related entity section", () => {
    fixture.componentRef.setInput("config", {
      component: "RelatedEntities",
      config: {
        entityType: "Note",
      },
    } as any);

    const activeFields = ["subject", "note"];

    expect(() => component.updateFields(activeFields)).not.toThrow();

    expect(component.config().config.columns).toEqual([
      { id: "subject" },
      { id: "note" },
    ]);
  });

  describe("field of an EmbeddedArrayData section", () => {
    beforeEach(() => {
      EmbedSectionPanelTest.schema.set("contactPersons", {
        dataType: "schema-embed-array",
        label: "Contact Persons",
        additional: { role: { dataType: "string", label: "Role" } },
      });
      fixture.componentRef.setInput("entityType", EmbedSectionPanelTest);
    });

    function sectionConfig(
      component: string,
      property: string,
    ): PanelComponent {
      return {
        component,
        config: { property } satisfies EmbeddedArrayDataConfig,
      };
    }

    it.each([
      ["EmbeddedArrayData", "contactPersons", "Contact Persons"],
      ["EmbeddedArrayData", "missingField", undefined],
      ["RelatedEntities", "contactPersons", undefined],
    ])(
      "offers to configure the displayed field (component: %s, property: %s)",
      (sectionComponent, property, expectedLabel) => {
        fixture.componentRef.setInput(
          "config",
          sectionConfig(sectionComponent, property),
        );
        fixture.detectChanges();

        expect(
          fixture.nativeElement.textContent.includes("Configure field"),
        ).toBe(!!expectedLabel);
        expect(component.sectionField()?.label).toBe(expectedLabel);
      },
    );

    it("updates the entity type's schema with the field edited in the dialog", () => {
      fixture.componentRef.setInput(
        "config",
        sectionConfig("EmbeddedArrayData", "contactPersons"),
      );
      const editedField = {
        ...EmbedSectionPanelTest.schema.get("contactPersons"),
        id: "contactPersons",
        label: "Contacts",
      };
      dialog.open.mockReturnValue(mockMatDialogRef(editedField));

      component.openSectionFieldConfig();

      expect(dialog.open.mock.calls[0][1].data.entitySchemaField).toEqual(
        expect.objectContaining({
          id: "contactPersons",
          label: "Contact Persons",
        }),
      );
      expect(updateSchemaField).toHaveBeenCalledWith(
        EmbedSectionPanelTest,
        "contactPersons",
        editedField,
      );
    });

    it("keeps the schema if the dialog is cancelled", () => {
      fixture.componentRef.setInput(
        "config",
        sectionConfig("EmbeddedArrayData", "contactPersons"),
      );
      dialog.open.mockReturnValue(mockMatDialogRef(undefined));

      component.openSectionFieldConfig();

      expect(updateSchemaField).not.toHaveBeenCalled();
    });
  });

  describe("columns of embedded entries", () => {
    beforeEach(() => {
      EmbedColumnsPanelTest.schema.set("contactPersons", {
        dataType: "schema-embed-array",
        label: "Contact Persons",
        additional: {
          role: { dataType: "string", label: "Role" },
          person: { dataType: "entity", additional: TestEntity.ENTITY_TYPE },
        },
      });
      EmbedColumnsPanelTest.schema.set("partners", {
        dataType: "schema-embed-array",
        label: "Partners",
        additional: {
          role: { dataType: "string", label: "Role" },
          organisation: { dataType: "entity", additional: "OtherType" },
        },
      });

      TestBed.inject(EntityRegistry).add(
        EmbedColumnsPanelTest.ENTITY_TYPE,
        EmbedColumnsPanelTest,
      );
      fixture.componentRef.setInput("entityType", TestEntity);
      fixture.componentRef.setInput("config", {
        component: "RelatedEntities",
        config: { entityType: EmbedColumnsPanelTest.ENTITY_TYPE },
      } as any);
    });

    function linkPartnersToTestEntity() {
      const partners = EmbedColumnsPanelTest.schema.get("partners");
      EmbedColumnsPanelTest.schema.set("partners", {
        ...partners,
        additional: {
          ...partners.additional,
          contact: { dataType: "entity", additional: TestEntity.ENTITY_TYPE },
        },
      });
    }

    it("updates the offered columns when the schema of the related type is edited", () => {
      expect(component.embeddedFieldColumns().map((c) => c.id)).toEqual([
        "contactPersons.role",
      ]);

      linkPartnersToTestEntity();
      entitySchemaUpdated.emit();

      expect(component.embeddedFieldColumns().map((c) => c.id)).toEqual([
        "contactPersons.role",
        "partners.role",
        "partners.organisation",
      ]);
    });

    it.each([
      [
        undefined,
        [
          { id: "contactPersons.role", label: "Contact Persons -> Role" },
          { id: "partners.role", label: "Partners -> Role" },
          { id: "partners.organisation", label: "Partners -> organisation" },
        ],
      ],
      [
        "contactPersons",
        [{ id: "contactPersons.role", label: "Contact Persons -> Role" }],
      ],
    ])(
      "offers the inner fields of the entries linking the records, without the link itself (property: %s)",
      (property, expected) => {
        linkPartnersToTestEntity();
        fixture.componentRef.setInput("config", {
          component: "RelatedEntities",
          config: { entityType: EmbedColumnsPanelTest.ENTITY_TYPE, property },
        } as any);

        expect(component.embeddedFieldColumns()).toEqual(expected);
      },
    );

    describe("data structure dialog", () => {
      beforeEach(() => {
        fixture.componentRef.setInput("config", {
          component: "RelatedEntities",
          config: {
            entityType: EmbedColumnsPanelTest.ENTITY_TYPE,
            columns: ["name", "contactPersons.role", "other"],
          },
        } as any);
      });

      it("keeps embedded columns out of the dialog", () => {
        dialog.open.mockReturnValue(mockMatDialogRef());

        component.openRelatedEntityDetailsConfig();

        expect(dialog.open.mock.calls[0][1].data.currentColumns).toEqual([
          "name",
          "other",
        ]);
      });

      it.each([
        [
          ["other", "name"],
          ["other", "name", "contactPersons.role"],
        ],
        [
          ["x", "y", "name", "other"],
          ["x", "y", "name", "contactPersons.role", "other"],
        ],
        [["other"], ["contactPersons.role", "other"]],
      ])(
        "puts embedded columns back behind the column they followed (dialog result %j)",
        (fieldIds, expected) => {
          dialog.open.mockReturnValue(
            mockMatDialogRef({ fieldIds, schemaChanged: false }),
          );

          component.openRelatedEntityDetailsConfig();

          expect(component.config().config.columns).toEqual(expected);
        },
      );

      it("drops embedded columns whose field was removed in the dialog", () => {
        const contactPersons =
          EmbedColumnsPanelTest.schema.get("contactPersons");
        dialog.open.mockImplementation(() => {
          EmbedColumnsPanelTest.schema.set("contactPersons", {
            ...contactPersons,
            additional: { person: contactPersons.additional.person },
          });
          return mockMatDialogRef({
            fieldIds: ["name", "other"],
            schemaChanged: true,
          });
        });

        component.openRelatedEntityDetailsConfig();

        expect(component.config().config.columns).toEqual(["name", "other"]);
      });
    });
  });
});

// the "Edit data structure" dialog opened by the panel, tested here to share the spec environment
describe("AdminRelatedEntityDetailsComponent", () => {
  let component: AdminRelatedEntityDetailsComponent;
  let schemaUpdateLabels: string[];

  beforeEach(() => {
    EmbedColumnsPanelTest.schema.set("role", {
      dataType: "string",
      label: "Role",
    });
    const entitySchemaUpdated = new EventEmitter<void>();
    schemaUpdateLabels = [];
    entitySchemaUpdated.subscribe(() =>
      schemaUpdateLabels.push(
        EmbedColumnsPanelTest.schema.get("role").label as string,
      ),
    );
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialogRef, useValue: mockMatDialogRef() },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entityConstructor: EmbedColumnsPanelTest,
            currentColumns: ["role"],
          },
        },
        { provide: AdminEntityService, useValue: { entitySchemaUpdated } },
      ],
    });
    component = TestBed.runInInjectionContext(
      () => new AdminRelatedEntityDetailsComponent(),
    );
    component.ngOnInit();
  });

  afterEach(() => {
    EmbedColumnsPanelTest.schema.delete("role");
  });

  it.each([
    ["Function", ["Role"]],
    ["Role", []],
  ])(
    "notifies schema listeners about the restored schema on cancel only if it was changed (edited label: %s)",
    (editedLabel, expectedUpdates) => {
      EmbedColumnsPanelTest.schema.set("role", {
        dataType: "string",
        label: editedLabel,
      });

      component.cancelChanges();

      expect(schemaUpdateLabels).toEqual(expectedUpdates);
    },
  );
});
