import { MenuItem } from "../../ui/navigation/menu-item";

export const CONFIG_SETUP_WIZARD_ID = "Config:SetupWizard";

export interface SetupWizardConfig {
  /** index of the current (last visited) step, to be opened when user returns to the wizard **/
  currentStep?: number;

  /** whether the wizard has been completed overall and should be hidden */
  finished?: boolean;

  steps: SetupWizardStep[];
}

export interface SetupWizardStep {
  title: string;
  text: string;
  actions?: MenuItem[];

  /** whether the user(s) have completed this step yet */
  completed?: boolean;
}

export const defaultSetupWizardConfig: SetupWizardConfig = {
  steps: [
    {
      title: $localize`:Setup Wizard Step Title:Welcome`,
      text: $localize`:Setup Wizard Step Text:
# Welcome to Aam Digital!
We are here to help you manage your participants' or beneficiaries' details
and your team's interactions with them.

The Aam Digital platform is very flexible and you can customize the structures and views
to exactly fit your project needs.
The following steps guide you through the most important configuration options for this.
And you can start working with your data within a few minutes already.

We also have some short video guides for you: [Aam Digital Video Guides (YouTube)](https://www.youtube.com/channel/UCZSFOX_MBa8zz5Mtfv_qlnA/videos)

Feel free to leave this setup wizard in between to explore the existing system first.
You can always come back to this view through the "Setup Wizard" button at the bottom of the main menu on the left.
To dismiss and hide this wizard, go to the last step of the wizard and "finish" the setup process.`,
    },
    {
      title: $localize`:Setup Wizard Step Title:Profiles & Fields`,
      text: $localize`:Setup Wizard Step Text:
The system already holds some basic structures for your case management.
You can adapt the fields and how the details are displayed.

If you have further requirements, don't hesitate to reach out to us at [support@aam-digital.com](mailto:support@aam-digital.com).

_Please note that the setup wizard and form builder is still under active development ("beta" version).
Some advanced configuration options are not available here yet for you to configure yourself and may need assistance from the tech support team.
We are currently extending and optimizing the user interfaces for these steps._
`,
      actions: [
        {
          label: $localize`:Setup Wizard Step Action:Customize Child profile`,
          link: "/admin/entity/Child",
        },
        {
          label: $localize`:Setup Wizard Step Action:Customize School profile`,
          link: "/admin/entity/School",
        },
      ],
    },
    {
      title: $localize`:Setup Wizard Step Title:User Accounts`,
      text: $localize`:Setup Wizard Step Text:
You can collaborate on Aam Digital as a team.
Data is synced and all users have access to the latest information.`,
      actions: [
        {
          label: $localize`:Setup Wizard Step Action:Manage User Accounts`,
          link: "/user",
        },
      ],
    },
    {
      title: $localize`:Setup Wizard Step Title:Import Data`,
      text: $localize`:Setup Wizard Step Text:
If you have exising data from a previous system, you can easily import it.
Save the data in ".csv" format (e.g. from MS Excel).
You do not need any specific column names in your file to be imported.
The Import Module helps your map your spreadsheet data to the relevant fields in your Aam Digital profiles.`,
      actions: [
        {
          label: $localize`:Setup Wizard Step Action:Import Data`,
          link: "/import",
        },
      ],
    },
    {
      title: $localize`:Setup Wizard Step Title:Done!`,
      text: $localize`:Setup Wizard Step Text:
That's it. You are ready to explore your system and start work!

You can always adapt your setup further, after you started using it.
We recommend to keep things simple in the beginning,
start using it for some of your tasks
and then add further fields and adjust your setup.

Feel free to reach out to us with your questions or feedback: [support@aam-digital.com](mailto:support@aam-digital.com)`,
    },
  ],
};
