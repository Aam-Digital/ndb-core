import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DateValueMappingComponent } from "./date-value-mapping.component";

describe("DateValueMappingComponent", () => {
  let component: DateValueMappingComponent;
  let fixture: ComponentFixture<DateValueMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DateValueMappingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DateValueMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
