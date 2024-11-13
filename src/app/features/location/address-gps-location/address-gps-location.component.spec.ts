import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AddressGpsLocationComponent } from "./address-gps-location.component";

describe("AddressGpsLocationComponent", () => {
  let component: AddressGpsLocationComponent;
  let fixture: ComponentFixture<AddressGpsLocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddressGpsLocationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddressGpsLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
