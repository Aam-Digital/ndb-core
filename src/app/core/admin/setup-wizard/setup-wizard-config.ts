import { MenuItem } from "../../ui/navigation/menu-item";

export const CONFIG_SETUP_WIZARD_ID = "Config:SetupWizard";

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
