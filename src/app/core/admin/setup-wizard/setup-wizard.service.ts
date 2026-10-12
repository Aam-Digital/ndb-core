import { computed, Injectable, signal } from "@angular/core";
import { LatestEntityLoader } from "../../entity/latest-entity-loader";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Config } from "../../config/config";
import { EntityConstructor } from "../../entity/model/entity";
import { Logging } from "../../logging/logging.service";
import {
  SetupWizardConfig,
  SETUP_WIZARD_CONFIG_KEY,
} from "./setup-wizard-config";

/** "unavailable" means this system has no wizard configured, as opposed to "error" where we simply could not load it. */
export type SetupWizardState = "loading" | "loaded" | "unavailable" | "error";

/**
 * Provides the SetupWizard config and its availability to all views offering the wizard,
 * so that they can hide it completely if this system does not have a wizard configured.
 */
@Injectable({ providedIn: "root" })
export class SetupWizardService extends LatestEntityLoader<
  Config<SetupWizardConfig>
> {
  private readonly _state = signal<SetupWizardState>("loading");
  private readonly _config = signal<Config<SetupWizardConfig> | undefined>(
    undefined,
  );

  readonly state = this._state.asReadonly();
  readonly config = this._config.asReadonly();

  readonly exists = computed(() => this._state() === "loaded");

  /** the wizard exists and has not been completed yet */
  readonly isPending = computed(
    () => this.exists() && !this._config()?.data?.finished,
  );

  constructor(
    // eslint-disable-next-line @angular-eslint/prefer-inject -- the base class requires the dependency to be passed to super()
    entityMapper: EntityMapperService,
  ) {
    super(
      Config as EntityConstructor<Config<SetupWizardConfig>>,
      SETUP_WIZARD_CONFIG_KEY,
      entityMapper,
    );
  }

  /**
   * Runs from the base class' constructor, before this class' fields are initialized,
   * so nothing here may read them synchronously.
   */
  protected override onInit() {
    this.entityUpdated.subscribe((entity) => {
      if (!entity?.data?.steps?.length) {
        // a deleted doc is emitted without any data, and a config without steps has nothing to show
        this.setUnavailable();
        return;
      }
      this._config.set(entity);
      this._state.set("loaded");
    });

    void this.loadConfig();
  }

  private async loadConfig() {
    try {
      const entity = await this.startLoading();
      // the "loaded" state is set through the entityUpdated subscription above,
      // which can already have received the config while we were still waiting here
      if (!entity && this._state() === "loading") {
        this.setUnavailable();
      }
    } catch (e) {
      Logging.warn("Failed to load SetupWizard config", e);
      if (this._state() === "loading") {
        this._state.set("error");
      }
    }
  }

  /**
   * Mark the wizard as completed, so that it is not actively offered anymore.
   */
  async markAsFinished(): Promise<void> {
    const config = this._config();
    if (!config) {
      return;
    }

    // a copy, because mutating the current entity would not notify the signal's consumers
    const updated = config.copy();
    updated.data.finished = true;
    await this.entityMapper.save(updated);
    this._config.set(updated);
  }

  private setUnavailable() {
    this._config.set(undefined);
    this._state.set("unavailable");
  }
}
