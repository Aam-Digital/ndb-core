import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportEntityTypeComponent } from "./import-entity-type.component";

describe("ImportSelectTypeComponent", () => {
  let component: ImportEntityTypeComponent;
  let fixture: ComponentFixture<ImportEntityTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImportEntityTypeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportEntityTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
