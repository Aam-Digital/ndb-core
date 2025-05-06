import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminDefaultValueDynamicComponent } from "./admin-default-value-dynamic.component";

describe("AdminDefaultValueDynamicComponent", () => {
  let component: AdminDefaultValueDynamicComponent;
  let fixture: ComponentFixture<AdminDefaultValueDynamicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDefaultValueDynamicComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDefaultValueDynamicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
