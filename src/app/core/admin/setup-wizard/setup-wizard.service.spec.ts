import { TestBed } from "@angular/core/testing";
import { Subject } from "rxjs";
import { SetupWizardService } from "./setup-wizard.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { Config } from "../../config/config";
import {
  CONFIG_SETUP_WIZARD_ID,
  SetupWizardConfig,
} from "./setup-wizard-config";

describe("SetupWizardService", () => {
  let entityMapper: { load: any; save: any; receiveUpdates: any };
  let updates: Subject<UpdatedEntity<Config<SetupWizardConfig>>>;

  function createConfig(data: Partial<SetupWizardConfig> = {}) {
    return new Config<SetupWizardConfig>(CONFIG_SETUP_WIZARD_ID, {
      steps: [{ title: "Welcome", text: "..." }],
      ...data,
    });
  }

  function initService(): SetupWizardService {
    TestBed.configureTestingModule({
      providers: [{ provide: EntityMapperService, useValue: entityMapper }],
    });
    return TestBed.inject(SetupWizardService);
  }

  beforeEach(() => {
    updates = new Subject();
    entityMapper = {
      load: vi.fn(),
      save: vi.fn(),
      receiveUpdates: vi.fn().mockReturnValue(updates),
    };
  });

  it.each([
    {
      description: "an existing, unfinished config",
      finished: false,
      isPending: true,
    },
    {
      description: "an already finished config",
      finished: true,
      isPending: false,
    },
  ])(
    "offers $description only while it is pending: $isPending",
    async ({ finished, isPending }) => {
      entityMapper.load.mockResolvedValue(createConfig({ finished }));
      const service = initService();

      await vi.waitFor(() => expect(service.state()).toBe("loaded"));
      expect(service.exists()).toBe(true);
      expect(service.isPending()).toBe(isPending);
    },
  );

  it("reports the wizard as unavailable if no config exists in the database", async () => {
    entityMapper.load.mockRejectedValue({ status: 404 });
    const service = initService();

    await vi.waitFor(() => expect(service.state()).toBe("unavailable"));
    expect(service.exists()).toBe(false);
    expect(service.config()).toBeUndefined();
  });

  it("distinguishes a failed load from a missing config", async () => {
    entityMapper.load.mockRejectedValue(new Error("connection failed"));
    const service = initService();

    await vi.waitFor(() => expect(service.state()).toBe("error"));
    expect(service.exists()).toBe(false);
  });

  it.each([
    ["a missing config", { status: 404 }],
    ["an unreachable database", new Error("connection failed")],
  ])(
    "keeps a config that arrived through an update while %s was still loading",
    async (_, loadRejection) => {
      let failLoad: () => void;
      entityMapper.load.mockReturnValue(
        new Promise((_resolve, reject) => {
          failLoad = () => reject(loadRejection);
        }),
      );
      const service = initService();

      // the config arrives through replication before the initial load settles
      updates.next({ entity: createConfig(), type: "new" });
      expect(service.state()).toBe("loaded");

      failLoad();
      await new Promise((resolve) => setTimeout(resolve));

      expect(service.state()).toBe("loaded");
      expect(service.config()).toBeDefined();
    },
  );

  it("treats a config without any steps like a missing one", async () => {
    entityMapper.load.mockResolvedValue(createConfig({ steps: [] }));
    const service = initService();

    await vi.waitFor(() => expect(service.state()).toBe("unavailable"));
    expect(service.config()).toBeUndefined();
  });

  it("becomes unavailable when the config is deleted", async () => {
    entityMapper.load.mockResolvedValue(createConfig());
    const service = initService();
    await vi.waitFor(() => expect(service.state()).toBe("loaded"));

    updates.next({
      entity: new Config(CONFIG_SETUP_WIZARD_ID),
      type: "remove",
    });

    expect(service.state()).toBe("unavailable");
    expect(service.config()).toBeUndefined();
  });

  it("applies updates of the config", async () => {
    entityMapper.load.mockResolvedValue(createConfig({ finished: false }));
    const service = initService();
    await vi.waitFor(() => expect(service.isPending()).toBe(true));

    updates.next({
      entity: createConfig({ finished: true }),
      type: "update",
    });

    expect(service.isPending()).toBe(false);
  });
  it("saves the wizard as finished without waiting for the database to report back", async () => {
    entityMapper.load.mockResolvedValue(createConfig({ finished: false }));
    const service = initService();
    await vi.waitFor(() => expect(service.isPending()).toBe(true));

    await service.markAsFinished();

    // no update is emitted through the changes feed here, so this only passes
    // if the service updates its own state
    expect(service.isPending()).toBe(false);
    const saved = entityMapper.save.mock
      .lastCall[0] as Config<SetupWizardConfig>;
    expect(saved.data.finished).toBe(true);
  });

  it("does not save anything as finished if no config is available", async () => {
    entityMapper.load.mockRejectedValue({ status: 404 });
    const service = initService();
    await vi.waitFor(() => expect(service.state()).toBe("unavailable"));

    await service.markAsFinished();

    expect(entityMapper.save).not.toHaveBeenCalled();
  });
});
