import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { PrimaryActionComponent } from "./primary-action.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ConfigService } from "../../config/config.service";
import { PrimaryActionConfig } from "../../admin/admin-primary-action/primary-action-config";
import { NEVER } from "rxjs";

describe("PrimaryActionComponent", () => {
  let component: PrimaryActionComponent;
  let fixture: ComponentFixture<PrimaryActionComponent>;
  let mockConfigService: jasmine.SpyObj<ConfigService>;

  const mockPrimaryActionConfig: PrimaryActionConfig = {
    icon: "file-alt",
    actionType: "createEntity",
    entityType: "Note",
  };

  beforeEach(waitForAsync(() => {
    mockConfigService = jasmine.createSpyObj("ConfigService", [
      "getConfig",
      "getAllConfigs",
    ]);
    mockConfigService.getConfig.and.returnValue(mockPrimaryActionConfig);
    mockConfigService.getAllConfigs.and.returnValue([]);
    mockConfigService.configUpdates = NEVER;

    TestBed.configureTestingModule({
      imports: [PrimaryActionComponent, MockedTestingModule.withState()],
      providers: [{ provide: ConfigService, useValue: mockConfigService }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrimaryActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
