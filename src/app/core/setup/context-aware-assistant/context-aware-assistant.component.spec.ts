import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ContextAwareAssistantComponent } from "./context-aware-assistant.component";
import { LocalDeviceResetService } from "../../database/local-device-reset.service";

describe("ContextAwareAssistantComponent", () => {
  let component: ContextAwareAssistantComponent;
  let fixture: ComponentFixture<ContextAwareAssistantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContextAwareAssistantComponent],
      providers: [{ provide: LocalDeviceResetService, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(ContextAwareAssistantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
