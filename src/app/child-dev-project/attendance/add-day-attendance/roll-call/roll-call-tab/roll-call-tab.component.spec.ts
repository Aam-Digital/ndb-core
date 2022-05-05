import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RollCallTabComponent } from "./roll-call-tab.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("RollCallTabComponent", () => {
  let component: RollCallTabComponent;
  let fixture: ComponentFixture<RollCallTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RollCallTabComponent],
      imports: [NoopAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RollCallTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
