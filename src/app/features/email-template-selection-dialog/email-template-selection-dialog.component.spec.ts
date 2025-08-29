import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import { EmailTemplateSelectionDialogComponent } from "./email-template-selection-dialog.component";
import { mockEntityMapperProvider } from "#src/app/core/entity/entity-mapper/mock-entity-mapper-service";
import {
  entityRegistry,
  EntityRegistry,
} from "#src/app/core/entity/database-entity.decorator";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import { ActivatedRoute } from "@angular/router";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("EmailTemplateSelectionDialogComponent", () => {
  let component: EmailTemplateSelectionDialogComponent;
  let fixture: ComponentFixture<EmailTemplateSelectionDialogComponent>;

  beforeEach(async () => {
    const mockAbility = jasmine.createSpyObj(["cannot", "on"]);
    mockAbility.on.and.returnValue(() => null);
    await TestBed.configureTestingModule({
      imports: [
        EmailTemplateSelectionDialogComponent,
        FontAwesomeTestingModule,
      ],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: jasmine.createSpy("close") },
        },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: EntityAbility, useValue: mockAbility },
        { provide: ActivatedRoute, useValue: null },

        ...mockEntityMapperProvider(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailTemplateSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
