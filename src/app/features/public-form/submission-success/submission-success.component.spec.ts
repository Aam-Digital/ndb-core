import { ActivatedRoute } from "@angular/router";

import { SubmissionSuccessComponent } from "./submission-success.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";

describe("SubmissionSuccessComponent", () => {
  let component: SubmissionSuccessComponent;
  let fixture: ComponentFixture<SubmissionSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmissionSuccessComponent, FontAwesomeTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
              queryParamMap: {
                get: () => undefined,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmissionSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
