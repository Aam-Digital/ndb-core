import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AutomatedFieldMappingComponent } from "./automated-field-mapping.component";

describe("AutomatedFieldMappingComponent", () => {
  let component: AutomatedFieldMappingComponent;
  let fixture: ComponentFixture<AutomatedFieldMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutomatedFieldMappingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AutomatedFieldMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
