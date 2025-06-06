import { TestBed } from "@angular/core/testing";

import { SetupService } from "./setup.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { provideHttpClient } from "@angular/common/http";
import { Config } from "../config/config";
import { DemoDataInitializerService } from "../demo-data/demo-data-initializer.service";
import { CoreTestingModule } from "../../utils/core-testing.module";
import { LoginStateSubject, SyncStateSubject } from "../session/session-type";

describe("SetupService", () => {
  let service: SetupService;

  let mockDemoDataInitializer: jasmine.SpyObj<DemoDataInitializerService>;

  beforeEach(() => {
    mockDemoDataInitializer = jasmine.createSpyObj(
      "DemoDataInitializerService",
      ["logInDemoUser"],
    );

    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        LoginStateSubject,
        provideHttpClient(),
        {
          provide: DemoDataInitializerService,
          useValue: mockDemoDataInitializer,
        },
        SyncStateSubject,
      ],
    });
    service = TestBed.inject(SetupService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should init config entity with json from assets folder", async () => {
    await service.initSystem({
      name: "Basic Setup",
      description:
        "A basic setup with minimal configuration to get started quickly.",
      entitiesToImport: ["basic/config.json"],
    });

    const actualConfig = await TestBed.inject(EntityMapperService).load(
      Config,
      Config.CONFIG_KEY,
    );
    expect(actualConfig).toBeTruthy();
  });
});
