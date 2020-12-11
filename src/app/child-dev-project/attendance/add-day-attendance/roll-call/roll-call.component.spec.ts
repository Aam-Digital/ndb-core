import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { RollCallComponent } from "./roll-call.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Note } from "../../../notes/model/note";

describe("RollCallComponent", () => {
  let component: RollCallComponent;
  let fixture: ComponentFixture<RollCallComponent>;

  const testEvent = Note.create(new Date());

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
