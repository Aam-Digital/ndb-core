import { ComponentFixture, TestBed } from "@angular/core/testing";

import { WidgetComponentSelectComponent } from "./widget-component-select.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";

describe("WidgetComponentSelectComponent", () => {
  let component: WidgetComponentSelectComponent;
  let fixture: ComponentFixture<WidgetComponentSelectComponent>;
  let mockEntityRelationsService: jasmine.SpyObj<EntityRelationsService>;

  beforeEach(async () => {
    mockEntityRelationsService = jasmine.createSpyObj(
      "EntityRelationsService",
      ["getEntityTypesReferencingType"],
    );
    await TestBed.configureTestingModule({
      imports: [WidgetComponentSelectComponent, FontAwesomeTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: () => null } },
        { provide: MAT_DIALOG_DATA, useValue: { entity: "Child" } },
        {
          provide: EntityRelationsService,
          useValue: mockEntityRelationsService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetComponentSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
