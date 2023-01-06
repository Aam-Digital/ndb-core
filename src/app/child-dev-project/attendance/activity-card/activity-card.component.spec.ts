import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ActivityCardComponent } from "./activity-card.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Note } from "../../notes/model/note";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ActivityCardComponent", () => {
  let component: ActivityCardComponent;
  let fixture: ComponentFixture<ActivityCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ActivityCardComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityCardComponent);
    component = fixture.componentInstance;
    component.event = Note.create(new Date());
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
