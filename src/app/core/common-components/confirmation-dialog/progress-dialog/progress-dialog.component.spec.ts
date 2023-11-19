import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ProgressDialogComponent } from "./progress-dialog.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

describe("ProgressDialogComponent", () => {
  let component: ProgressDialogComponent;
  let fixture: ComponentFixture<ProgressDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ProgressDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { message: "test title" },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
