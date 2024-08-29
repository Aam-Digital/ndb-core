import { ComponentFixture, TestBed } from "@angular/core/testing";

import { InheritedValueButtonComponent } from "./inherited-value-button.component";
import { DefaultValueService } from "../default-value.service";

describe("InheritedValueButtonComponent", () => {
  let component: InheritedValueButtonComponent;
  let fixture: ComponentFixture<InheritedValueButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InheritedValueButtonComponent],
      providers: [
        {
          provide: DefaultValueService,
          useValue: jasmine.createSpyObj(["getDefaultValueUiHint"]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InheritedValueButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
