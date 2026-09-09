import { MenuItem } from "../../ui/navigation/menu-item";

export const CONFIG_SETUP_WIZARD_ID = "Config:SetupWizard";

export interface SetupWizardConfig {
  /** whether the wizard has been completed overall and should be hidden */
  finished?: boolean;

  /** whether users should on startup be navigated automatically to the setup wizard screen while it is not finished */
  openOnStart?: boolean;

  steps: SetupWizardStep[];
}

/** stored, the texts may be per-language maps - resolved for display (#3862) */
export interface SetupWizardStep {
  title: string;
  text: string;
  actions?: MenuItem[];
}
