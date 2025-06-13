import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ContextAwareDialogComponent } from "./context-aware-dialog.component";

describe("ContextAwareDialogComponent", () => {
  let component: ContextAwareDialogComponent;
  let fixture: ComponentFixture<ContextAwareDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContextAwareDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContextAwareDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
