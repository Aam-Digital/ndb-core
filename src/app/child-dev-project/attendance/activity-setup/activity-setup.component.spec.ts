import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ActivitySetupComponent } from "./activity-setup.component";

xdescribe("ActivitySetupComponent", () => {
  let component: ActivitySetupComponent;
  let fixture: ComponentFixture<ActivitySetupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ActivitySetupComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivitySetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
