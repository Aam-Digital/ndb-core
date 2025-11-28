import { Component } from "@angular/core";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";
import { MatTooltip } from "@angular/material/tooltip";

@Component({
  selector: "app-advanced-features",
  imports: [ViewTitleComponent, HintBoxComponent, MatTooltip],
  templateUrl: "./advanced-features.component.html",
  styleUrl: "./advanced-features.component.scss",
})
export class AdvancedFeaturesComponent {
  protected features = [
    {
      title: $localize`:|Admin UI advanced features list:Offline Usage`,
      status: "enabled",
      description: $localize`:|Admin UI advanced features list:Our application supports offline usage, allowing you to access and modify data without an internet connection. Changes made offline will be synchronized once you're back online.`,
    },
    {
      title: $localize`:|Admin UI advanced features list:User Roles & Permissions`,
      status: "?",
      description: $localize`:|Admin UI advanced features list:Define different roles to control access to various features and data within the application. Assign these individually, so that users have appropriate access levels.`,
    },
    {
      title: $localize`:|Admin UI advanced features list:Reporting & Analysis`,
      status: "?",
      description: $localize`:|Admin UI advanced features list:Calculate advanced statistics and analyze records across their relationships using custom SQL queries.`,
    },
    {
      title: $localize`:|Admin UI advanced features list:PDF Generation`,
      status: "?",
      description: $localize`:|Admin UI advanced features list:Generate PDF documents from your data entries based on custom Word templates for easy sharing and printing.`,
    },
    {
      title: $localize`:|Admin UI advanced features list:Notifications`,
      status: "?",
      description: $localize`:|Admin UI advanced features list:Stay informed with in-app notifications about important events and updates relevant to the activities of your team.`,
    },
    {
      title: $localize`:|Admin UI advanced features list:API Integrations`,
      status: "?",
      description: $localize`:|Admin UI advanced features list:Connect with third-party systems to automatically pass data from Aam Digital to other tools in real-time to automate more of your workflows.`,
    },
    {
      title: $localize`:|Admin UI advanced features list:Single Sign-On (SSO)`,
      status: "?",
      description: $localize`:|Admin UI advanced features list:Simplify the login process by integrating with your organization's identity provider, allowing users to access the application using their existing credentials.`,
    },
  ];
}
