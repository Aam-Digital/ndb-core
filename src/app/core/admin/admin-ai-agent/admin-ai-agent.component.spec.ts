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
    const mockEntityMapper = jasmine.createSpyObj("EntityMapperService", [
      "loadType",
      "load",
    ]);
    mockEntityMapper.loadType.and.returnValue(Promise.resolve([]));
    mockEntityMapper.load.and.returnValue(Promise.resolve(null));

    const mockDownloadService = jasmine.createSpyObj("DownloadService", [
      "triggerDownload",
    ]);
    mockDownloadService.triggerDownload.and.returnValue(Promise.resolve());

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
