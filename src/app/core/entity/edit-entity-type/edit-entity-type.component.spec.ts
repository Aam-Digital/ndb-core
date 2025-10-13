import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntityRegistry } from "../database-entity.decorator";
import { setupCustomFormControlEditComponent } from "../entity-field-edit/dynamic-edit/edit-component-test-utils";
import { EditEntityTypeComponent } from "./edit-entity-type.component";

describe("EditEntityTypeComponent", () => {
  let component: EditEntityTypeComponent;
  let fixture: ComponentFixture<EditEntityTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditEntityTypeComponent, NoopAnimationsModule],
      providers: [EntityRegistry],
    }).compileComponents();

    fixture = TestBed.createComponent(EditEntityTypeComponent);
    component = fixture.componentInstance;

    setupCustomFormControlEditComponent(component);

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
