import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatTooltipModule } from "@angular/material/tooltip";
import { By } from "@angular/platform-browser";
import { Subject } from "rxjs";

import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { AdminEntityService } from "../../admin/admin-entity.service";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { DatabaseEntity, EntityRegistry } from "../database-entity.decorator";
import { DatabaseField } from "../database-field.decorator";
import { Entity } from "../model/entity";
import { EntityFieldLabelComponent } from "./entity-field-label.component";

// Test Entity for testing purposes
@DatabaseEntity("TestLabelEntity")
class TestLabelEntity extends Entity {
  @DatabaseField({
    label: "Test Name",
    description: "A test name field",
  })
  name: string;

  @DatabaseField({
    label: "Test Number",
    description: "A test number field",
  })
  testNumber: number;

  @DatabaseField({
    label: "Hidden Field",
  })
  hiddenField: string;
}

describe("EntityFieldLabelComponent", () => {
  let component: EntityFieldLabelComponent;
  let fixture: ComponentFixture<EntityFieldLabelComponent>;
  let entityRegistry: EntityRegistry;
  let schemaUpdateSubject: Subject<void>;

  beforeEach(async () => {
    schemaUpdateSubject = new Subject<void>();

    await TestBed.configureTestingModule({
      imports: [
        EntityFieldLabelComponent,
        MatTooltipModule,
        MockedTestingModule.withState(),
      ],
      providers: [
        {
          provide: AdminEntityService,
          useValue: jasmine.createSpyObj("AdminEntityService", [], {
            entitySchemaUpdated: schemaUpdateSubject.asObservable(),
          }),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityFieldLabelComponent);
    component = fixture.componentInstance;
    entityRegistry = TestBed.inject(EntityRegistry);

    spyOn(entityRegistry, "get").and.returnValue(TestLabelEntity);
  });

  afterEach(() => {
    schemaUpdateSubject.complete();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display the correct label for a given field object", () => {
    const fieldConfig: FormFieldConfig = {
      id: "testField",
      label: "Custom Field Label",
      description: "Custom field description",
    };

    fixture.componentRef.setInput("field", fieldConfig);
    fixture.componentRef.setInput("entityType", TestLabelEntity);
    fixture.detectChanges();

    const spanElement = fixture.debugElement.query(By.css("span"));
    expect(spanElement).toBeTruthy();
    expect(spanElement.nativeElement.textContent.trim()).toBe(
      "Custom Field Label",
    );
    expect(component._field().description).toBe("Custom field description");
  });

  it("should display the correct label for a given field string id and entityType", () => {
    fixture.componentRef.setInput("field", "name");
    fixture.componentRef.setInput("entityType", TestLabelEntity);
    fixture.detectChanges();

    const spanElement = fixture.debugElement.query(By.css("span"));
    expect(spanElement).toBeTruthy();
    expect(spanElement.nativeElement.textContent.trim()).toBe("Test Name");
    expect(component._field().description).toBe("A test name field");
  });

  it("should display the correct label for the given field id and entityType string id", () => {
    fixture.componentRef.setInput("field", "testNumber");
    fixture.componentRef.setInput("entityType", "TestEntity");
    fixture.detectChanges();

    const spanElement = fixture.debugElement.query(By.css("span"));
    expect(spanElement).toBeTruthy();
    expect(spanElement.nativeElement.textContent.trim()).toBe("Test Number");
    expect(component._field().description).toBe("A test number field");
  });

  it("should display the correct label for a custom additional field", () => {
    const additionalFieldConfig: FormFieldConfig = {
      id: "customField",
      label: "Custom Additional Field",
      description: "This is a custom additional field",
    };

    fixture.componentRef.setInput("field", "customField");
    fixture.componentRef.setInput("entityType", TestLabelEntity);
    fixture.componentRef.setInput("additionalFields", [additionalFieldConfig]);
    fixture.detectChanges();

    const spanElement = fixture.debugElement.query(By.css("span"));
    expect(spanElement).toBeTruthy();
    expect(spanElement.nativeElement.textContent.trim()).toBe(
      "Custom Additional Field",
    );
  });

  it("should fallback to field id when no label is available", () => {
    const fieldConfigWithoutLabel: FormFieldConfig = {
      id: "fieldWithoutLabel",
    };

    fixture.componentRef.setInput("field", fieldConfigWithoutLabel);
    fixture.componentRef.setInput("entityType", TestLabelEntity);
    fixture.detectChanges();

    const spanElement = fixture.debugElement.query(By.css("span"));
    expect(spanElement).toBeTruthy();
    expect(spanElement.nativeElement.textContent.trim()).toBe(
      "fieldWithoutLabel",
    );
  });

  it("should not display anything when no entityType is provided", () => {
    fixture.componentRef.setInput("field", "name");
    fixture.componentRef.setInput("entityType", undefined);
    fixture.detectChanges();

    const spanElement = fixture.debugElement.query(By.css("span"));
    expect(spanElement).toBeFalsy();
  });

  it("should update when field changes", () => {
    // Set initial field
    fixture.componentRef.setInput("field", "name");
    fixture.componentRef.setInput("entityType", TestLabelEntity);
    fixture.detectChanges();

    let spanElement = fixture.debugElement.query(By.css("span"));
    expect(spanElement.nativeElement.textContent.trim()).toBe("Test Name");

    // Change to different field
    fixture.componentRef.setInput("field", "testNumber");
    fixture.detectChanges();

    spanElement = fixture.debugElement.query(By.css("span"));
    expect(spanElement.nativeElement.textContent.trim()).toBe("Test Number");
  });
});
