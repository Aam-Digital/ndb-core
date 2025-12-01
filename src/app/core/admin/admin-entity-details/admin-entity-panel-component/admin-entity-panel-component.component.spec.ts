import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminEntityPanelComponentComponent } from "./admin-entity-panel-component.component";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { EntityRelationsService } from "app/core/entity/entity-mapper/entity-relations.service";
import { MatDialogModule } from "@angular/material/dialog";

describe("AdminEntityPanelComponentComponent", () => {
  let component: AdminEntityPanelComponentComponent;
  let fixture: ComponentFixture<AdminEntityPanelComponentComponent>;
  let mockEntityRelationsService: jasmine.SpyObj<EntityRelationsService>;

  beforeEach(async () => {
    mockEntityRelationsService = jasmine.createSpyObj(
      "EntityRelationsService",
      ["getEntityTypesReferencingType"],
    );
    await TestBed.configureTestingModule({
      imports: [AdminEntityPanelComponentComponent, MatDialogModule],
      providers: [
        EntityRegistry,
        {
          provide: EntityRelationsService,
          useValue: mockEntityRelationsService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEntityPanelComponentComponent);
    component = fixture.componentInstance;

    component.config = {
      component: "SomeComponent",
    };

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should handle undefined columns when creating new related entity section", () => {
    component.config = {
      component: "RelatedEntities",
      config: {
        entityType: "Note",
      },
    };

    const activeFields = ["subject", "note"];

    expect(() => component.updateFields(activeFields)).not.toThrow();

    expect(component.config.config.columns).toEqual([
      { id: "subject" },
      { id: "note" },
    ]);
  });
});
