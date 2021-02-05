import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { RollCallComponent } from "./roll-call.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Note } from "../../../notes/model/note";
import { By } from "@angular/platform-browser";
import { ConfigService } from "../../../../core/config/config.service";
import { ConfigurableEnumConfig } from "../../../../core/configurable-enum/configurable-enum.interface";

describe("RollCallComponent", () => {
  let component: RollCallComponent;
  let fixture: ComponentFixture<RollCallComponent>;

  const testEvent = Note.create(new Date());
  let mockConfigService: jasmine.SpyObj<ConfigService>;

  beforeEach(async(() => {
    mockConfigService = jasmine.createSpyObj("mockConfigService", [
      "getConfig",
    ]);
    mockConfigService.getConfig.and.returnValue([]);

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      declarations: [RollCallComponent],
      providers: [{ provide: ConfigService, useValue: mockConfigService }],
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

  it("should display all available attendance status to select", async () => {
    const testStatusEnumConfig: ConfigurableEnumConfig = [
      {
        id: "PRESENT",
        shortName: "P",
        label: "Present",
        style: "attendance-P",
        countAs: "PRESENT",
      },
      {
        id: "ABSENT",
        shortName: "A",
        label: "Absent",
        style: "attendance-A",
        countAs: "ABSENT",
      },
    ];
    mockConfigService.getConfig.and.returnValue(testStatusEnumConfig);
    component.eventEntity = Note.create(new Date());
    component.eventEntity.addChild("1");
    await component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    const statusOptions = fixture.debugElement.queryAll(
      By.css(".group-select-option")
    );
    expect(statusOptions.length).toBe(testStatusEnumConfig.length);
  });
});
