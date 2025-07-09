import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityComponentSelectComponent } from "./entity-component-select-component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";

describe("EntityComponentSelectComponent", () => {
  let component: EntityComponentSelectComponent;
  let fixture: ComponentFixture<EntityComponentSelectComponent>;
  let mockEntityRelationsService: jasmine.SpyObj<EntityRelationsService>;

  beforeEach(async () => {
    mockEntityRelationsService = jasmine.createSpyObj(
      "EntityRelationsService",
      ["getEntityTypesReferencingType"],
    );
    await TestBed.configureTestingModule({
      imports: [EntityComponentSelectComponent, FontAwesomeTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: () => null } },
        { provide: MAT_DIALOG_DATA, useValue: { entity: "child" } },
        {
          provide: EntityRelationsService,
          useValue: mockEntityRelationsService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityComponentSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
