import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminEntityPanelComponentComponent } from "./admin-entity-panel-component.component";
import {
  DatabaseEntity,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { EntityRelationsService } from "app/core/entity/entity-mapper/entity-relations.service";
import { MatDialogModule } from "@angular/material/dialog";
import { EventEmitter } from "@angular/core";
import { Entity } from "app/core/entity/model/entity";
import { DefaultDatatype } from "app/core/entity/default-datatype/default.datatype";
import { SchemaEmbedArrayDatatype } from "app/core/basic-datatypes/schema-embed/schema-embed-array.datatype";
import { AdminEntityService } from "app/core/admin/admin-entity.service";
import { TestEntity } from "app/utils/test-utils/TestEntity";

@DatabaseEntity("EmbedColumnsPanelTest")
class EmbedColumnsPanelTest extends Entity {}

describe("AdminEntityPanelComponentComponent", () => {
  let component: AdminEntityPanelComponentComponent;
  let fixture: ComponentFixture<AdminEntityPanelComponentComponent>;
  let mockEntityRelationsService: any;
  let entitySchemaUpdated: EventEmitter<void>;

  beforeEach(async () => {
    mockEntityRelationsService = {
      getEntityTypesReferencingType: vi
        .fn()
        .mockReturnValue([])
        .mockName("EntityRelationsService.getEntityTypesReferencingType"),
    };
    entitySchemaUpdated = new EventEmitter<void>();
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
          useValue: { entitySchemaUpdated },
        },
        {
          provide: DefaultDatatype,
          useClass: SchemaEmbedArrayDatatype,
          multi: true,
        },
      ],
    }).compileComponents();

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

    it("offers only the inner fields of embedded entries linking the current entity type, without the link itself", () => {
      expect(component.embeddedFieldColumns()).toEqual([
        { id: "contactPersons.role", label: "Contact Persons -> Role" },
      ]);
    });

    it("updates the offered columns when the schema of the related type is edited", () => {
      component.embeddedFieldColumns();

      const partners = EmbedColumnsPanelTest.schema.get("partners");
      EmbedColumnsPanelTest.schema.set("partners", {
        ...partners,
        additional: {
          ...partners.additional,
          contact: { dataType: "entity", additional: TestEntity.ENTITY_TYPE },
        },
      });
      entitySchemaUpdated.emit();

      expect(component.embeddedFieldColumns().map((c) => c.id)).toEqual([
        "contactPersons.role",
        "partners.role",
        "partners.organisation",
      ]);
    });
  });
});
