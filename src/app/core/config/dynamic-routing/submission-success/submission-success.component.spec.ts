import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SubmissionSuccessComponent } from "./submission-success.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("SubmissionSuccessComponent", () => {
  let component: SubmissionSuccessComponent;
  let fixture: ComponentFixture<SubmissionSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmissionSuccessComponent, FontAwesomeTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmissionSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
