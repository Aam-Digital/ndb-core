import { TestBed } from "@angular/core/testing";

import { SetupService } from "./setup.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../entity/entity-mapper/mock-entity-mapper-service";
import { provideHttpClient } from "@angular/common/http";
import { Config } from "../config/config";

describe("SetupService", () => {
  let service: SetupService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        { provide: EntityMapperService, useValue: mockEntityMapper() },
      ],
    });
    service = TestBed.inject(SetupService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should init config entity with json from assets folder", async () => {
    await service.initSystemWithBaseConfig({
      id: "basic",
      name: "Basic Setup",
      description:
        "A basic setup with minimal configuration to get started quickly.",
    });

    const actualConfig = await TestBed.inject(EntityMapperService).load(
      Config,
      Config.CONFIG_KEY,
    );
    expect(actualConfig).toBeTruthy();
    console.log(actualConfig);
  });
});
