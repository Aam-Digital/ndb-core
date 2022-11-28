import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ProgressComponent } from "./progress.component";
import { MAT_SNACK_BAR_DATA } from "@angular/material/snack-bar";
import { of } from "rxjs";
import { MatProgressBarModule } from "@angular/material/progress-bar";

describe("ProgressComponent", () => {
  let component: ProgressComponent;
  let fixture: ComponentFixture<ProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProgressComponent],
      imports: [MatProgressBarModule],
      providers: [
        {
          provide: MAT_SNACK_BAR_DATA,
          useValue: { message: "Some label", progress: of(10) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
