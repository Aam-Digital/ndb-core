import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FilterOverlayComponent } from "./filter-overlay.component";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";

describe("FilterOverlayComponent", () => {
  let component: FilterOverlayComponent<any>;
  let fixture: ComponentFixture<FilterOverlayComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule],
      declarations: [FilterOverlayComponent],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: {} }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
