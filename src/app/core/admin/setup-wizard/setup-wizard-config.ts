import { MenuItem } from "../../ui/navigation/menu-item";

/** id of the SetupWizard Config entity, without the entity type prefix */
export const SETUP_WIZARD_CONFIG_KEY = "SetupWizard";

export const CONFIG_SETUP_WIZARD_ID = "Config:" + SETUP_WIZARD_CONFIG_KEY;

export const SETUP_WIZARD_ROUTE = "/admin/setup-wizard";

export interface SetupWizardConfig {
  /** whether the wizard has been completed overall and should be hidden */
  finished?: boolean;

  /** whether users should on startup be navigated automatically to the setup wizard screen while it is not finished */
  openOnStart?: boolean;

  steps: SetupWizardStep[];
}

export interface SetupWizardStep {
  title: string;
  text: string;
  actions?: MenuItem[];
}
