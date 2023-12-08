import { Routes } from "@angular/router";
import { RoutedViewComponent } from "../ui/routed-view/routed-view.component";
import { AdminComponent } from "./admin/admin.component";
import { ConfigImportComponent } from "../../features/config-setup/config-import/config-import.component";
import { ConflictResolutionListComponent } from "../../features/conflict-resolution/conflict-resolution-list/conflict-resolution-list.component";

export const routes: Routes = [
  {
    path: "",
    component: AdminComponent,
  },
  {
    path: "entity/:entityType/details",
    component: RoutedViewComponent,
    data: {
      component: "AdminEntity",
    },
  },

  {
    path: "site-settings",
    component: RoutedViewComponent,
    data: {
      component: "EntityDetails",
      config: {
        entity: "SiteSettings",
        id: "global",
        panels: [
          {
            title: $localize`Site Settings`,
            components: [
              {
                component: "Form",
                config: {
                  fieldGroups: [
                    { fields: ["logo", "favicon"] },
                    {
                      fields: [
                        "siteName",
                        "defaultLanguage",
                        "displayLanguageSelect",
                      ],
                    },
                    { fields: ["primary", "secondary", "error", "font"] },
                  ],
                },
              },
            ],
          },
        ],
      },
    },
  },
  {
    path: "config-import",
    component: ConfigImportComponent,
  },
  {
    path: "conflicts",
    component: ConflictResolutionListComponent,
  },
];
