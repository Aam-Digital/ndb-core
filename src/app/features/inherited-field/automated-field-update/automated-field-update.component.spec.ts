import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AutomatedFieldUpdateComponent } from "./automated-field-update.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { EntityFormService } from "#src/app/core/common-components/entity-form/entity-form.service";
import { toFormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AutomatedFieldUpdateComponent", () => {
  let component: AutomatedFieldUpdateComponent;
  let fixture: ComponentFixture<AutomatedFieldUpdateComponent>;
  let mockFormService: jasmine.SpyObj<EntityFormService>;

  beforeEach(async () => {
    mockFormService = jasmine.createSpyObj(["extendFormFieldConfig"]);
    mockFormService.extendFormFieldConfig.and.callFake((c) =>
      toFormFieldConfig(c),
    );
    await TestBed.configureTestingModule({
      imports: [AutomatedFieldUpdateComponent, FontAwesomeTestingModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { entities: [] } },
        {
          provide: MatDialogRef,
          useValue: { close: jasmine.createSpy("close") },
        },
        { provide: EntityFormService, useValue: mockFormService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AutomatedFieldUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
