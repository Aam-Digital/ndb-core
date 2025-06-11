import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { SetupService } from "./setup.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { provideHttpClient } from "@angular/common/http";
import { Config } from "../config/config";
import { DemoDataInitializerService } from "../demo-data/demo-data-initializer.service";
import { CoreTestingModule } from "../../utils/core-testing.module";
import { LoginStateSubject, SyncStateSubject } from "../session/session-type";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { BaseConfig } from "./base-config";

describe("SetupService", () => {
  let service: SetupService;

  let mockDemoDataInitializer: jasmine.SpyObj<DemoDataInitializerService>;
  let httpTesting: HttpTestingController;

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
        provideHttpClientTesting(),
        {
          provide: DemoDataInitializerService,
          useValue: mockDemoDataInitializer,
        },
        SyncStateSubject,
      ],
    });
    service = TestBed.inject(SetupService);

    httpTesting = TestBed.inject(HttpTestingController);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should get all available base configs from json file", async () => {
    const baseConfigsPromise = service.getAvailableBaseConfig();

    const configFile = [
      {
        id: "basic_setup",
        name: "Basic Setup",
        description: "A basic setup ...",
        entitiesToImport: ["basic/config.json"],
      },
    ];
    httpTesting
      .expectOne("assets/base-configs/available-configs.json")
      .flush(configFile);

    const baseConfigs = await baseConfigsPromise;
    expect(baseConfigs).toBeTruthy();
    expect(baseConfigs.length).toEqual(1);
    expect(baseConfigs[0].id).toBeDefined();
    expect(baseConfigs[0].name).toBeDefined();
  });

  it("should return an empty array without throwing errors if no available-configs file exists", async () => {
    const baseConfigsPromise = service.getAvailableBaseConfig();

    httpTesting
      .expectOne("assets/base-configs/available-configs.json")
      .flush(null, { status: 404, statusText: "Not Found" });

    expect(await baseConfigsPromise).toEqual([]);
  });

  it("should init multiple config files during init", fakeAsync(async () => {
    const testBaseConfig: BaseConfig = {
      id: "basic_setup",
      name: "Basic Setup",
      description:
        "A basic setup with minimal configuration to get started quickly.",
      entitiesToImport: ["basic/config_1.json", "basic/config_2.json"],
    };
    const testEntityToImport = {
      _id: "Config:CONFIG_ENTITY",
      data: {},
    };

    const result = service.initSystemWithBaseConfig(testBaseConfig);
    httpTesting
      .expectOne("assets/base-configs/" + testBaseConfig.entitiesToImport[0])
      .flush(testEntityToImport);
    tick();
    httpTesting
      .expectOne("assets/base-configs/" + testBaseConfig.entitiesToImport[1])
      .flush(testEntityToImport);

    await result;

    const actualConfig = await TestBed.inject(EntityMapperService).load(
      Config,
      Config.CONFIG_KEY,
    );
    expect(actualConfig).toBeTruthy();
  }));
});
