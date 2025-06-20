import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CustomFormLinkButtonComponent } from "./custom-form-link-button.component";

describe("CustomFormLinkButtonComponent", () => {
  let component: CustomFormLinkButtonComponent;
  let fixture: ComponentFixture<CustomFormLinkButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomFormLinkButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomFormLinkButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
