import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { RollCallComponent } from "./roll-call.component";
import { EventNote } from "../../model/event-note";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("RollCallComponent", () => {
  let component: RollCallComponent;
  let fixture: ComponentFixture<RollCallComponent>;

  const testEvent = EventNote.create(new Date());

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      declarations: [RollCallComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RollCallComponent);
    component = fixture.componentInstance;
    component.eventEntity = testEvent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
