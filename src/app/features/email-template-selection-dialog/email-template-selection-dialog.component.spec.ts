import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EmailTemplate } from "../email-client/email-template.entity";

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

  it("should set selected template in form control", () => {
    const fakeTemplate = { subject: "Test Subject", body: "Test Body" } as any;
    component.selectedTemplate(fakeTemplate);
    expect(component.emailTemplateSelectionForm.value).toEqual(fakeTemplate);
  });

  it("should close dialog with selected template", () => {
    const fakeTemplate = { subject: "Test Subject", body: "Test Body" } as any;
    const entityMapper = TestBed.inject(
      EntityMapperService,
    ) as unknown as jasmine.SpyObj<EntityMapperService>;
    const expectedPromise = Promise.resolve({
      _id: "EmailTemplate:test",
    } as any);
    spyOn(entityMapper, "load").and.returnValue(expectedPromise);
    component.selectedTemplate(fakeTemplate);

    expect(entityMapper.load).toHaveBeenCalledWith(
      EmailTemplate.ENTITY_TYPE,
      fakeTemplate,
    );

    const dialogRef = TestBed.inject(MatDialogRef);
    expect(dialogRef.close).toHaveBeenCalledWith(expectedPromise);
  });
});
