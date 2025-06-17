import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ContextAwareAssistantComponent } from "./context-aware-assistant.component";

describe("ContextAwareAssistantComponent", () => {
  let component: ContextAwareAssistantComponent;
  let fixture: ComponentFixture<ContextAwareAssistantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContextAwareAssistantComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContextAwareAssistantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
