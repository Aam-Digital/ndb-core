import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditPrefilledValuesComponent } from "./edit-prefilled-values.component";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { Entity } from "app/core/entity/model/entity";
import { TestEntity } from "app/utils/test-utils/TestEntity";

describe("EditPrefilledValuesComponent", () => {
  let component: EditPrefilledValuesComponent;
  let fixture: ComponentFixture<EditPrefilledValuesComponent>;
  let mockEntityRegistry: Partial<EntityRegistry>;

  beforeEach(async () => {
    mockEntityRegistry = {
      get: jasmine.createSpy("get").and.returnValue(Entity),
    };

    await TestBed.configureTestingModule({
      imports: [
        EditPrefilledValuesComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatTooltipModule,
        FontAwesomeTestingModule,
        MatButtonModule,
        NoopAnimationsModule,
      ],
      providers: [{ provide: EntityRegistry, useValue: mockEntityRegistry }],
    }).compileComponents();

    fixture = TestBed.createComponent(EditPrefilledValuesComponent);
    component = fixture.componentInstance;
    component.entity = new TestEntity();
    component.formControl = new FormBuilder().control([]);
    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should remove a field from prefilled values", () => {
    component.prefilledValues.push(
      new FormBuilder().group({
        field: "name",
        defaultValue: { mode: "static", value: "default name" },
        hideFromForm: true,
      }),
    );

    component.removePrefilledFields(0);

    expect(component.prefilledValues.length).toBe(0);
  });
});
