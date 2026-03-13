import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { AdminAiAgentComponent } from "./admin-ai-agent.component";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { DownloadService } from "../../export/download-service/download.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AdminAiAgentComponent", () => {
  let component: AdminAiAgentComponent;
  let fixture: ComponentFixture<AdminAiAgentComponent>;

  beforeEach(waitForAsync(() => {
    const mockEntityMapper = {
      loadType: vi.fn().mockName("EntityMapperService.loadType"),
      load: vi.fn().mockName("EntityMapperService.load"),
    };
    mockEntityMapper.loadType.mockReturnValue(Promise.resolve([]));
    mockEntityMapper.load.mockReturnValue(Promise.resolve(null));

    const mockDownloadService = {
      triggerDownload: vi.fn().mockName("DownloadService.triggerDownload"),
    };
    mockDownloadService.triggerDownload.mockReturnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [
        AdminAiAgentComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: DownloadService, useValue: mockDownloadService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminAiAgentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
