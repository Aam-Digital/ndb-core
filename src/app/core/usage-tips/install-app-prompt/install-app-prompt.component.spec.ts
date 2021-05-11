import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { InstallAppPromptComponent } from "./install-app-prompt.component";

describe("InstallAppPromptComponent", () => {
  let component: InstallAppPromptComponent;
  let fixture: ComponentFixture<InstallAppPromptComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InstallAppPromptComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InstallAppPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
