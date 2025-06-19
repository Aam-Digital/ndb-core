import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ContextAwareAssistantComponent } from "./context-aware-assistant.component";
import { BackupService } from "../../admin/backup/backup.service";

describe("ContextAwareAssistantComponent", () => {
  let component: ContextAwareAssistantComponent;
  let fixture: ComponentFixture<ContextAwareAssistantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContextAwareAssistantComponent],
      providers: [{ provide: BackupService, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(ContextAwareAssistantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
