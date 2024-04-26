import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminEntityTextComponent } from "./admin-entity-text.component";

fdescribe("AdminEntityTextComponent", () => {
  let component: AdminEntityTextComponent;
  let fixture: ComponentFixture<AdminEntityTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEntityTextComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEntityTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
