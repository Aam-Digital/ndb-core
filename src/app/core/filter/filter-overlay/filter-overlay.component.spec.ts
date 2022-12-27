import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FilterOverlayComponent } from "./filter-overlay.component";
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogModule as MatDialogModule } from "@angular/material/legacy-dialog";

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
