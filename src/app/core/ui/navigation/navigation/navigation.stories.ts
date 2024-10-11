import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { NavigationComponent } from "./navigation.component";
import { MenuItem } from "../menu-item";

export default {
  title: "Core/UI/Navigation",
  component: NavigationComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<NavigationComponent> = (args: NavigationComponent) => ({
  component: NavigationComponent,
  props: args,
});

const flatMenuItems: MenuItem[] = [
  {
    label: "Home",
    icon: "home",
    target: "/",
    subMenu: [],
  },
  {
    label: "About",
    icon: "info",
    target: "/about",
  },
  {
    label: "Contact",
    icon: "contact",
    target: "/contact",
  },
];

const nestedMenuItems: MenuItem[] = [
  {
    label: "Services",
    icon: "build",
    subMenu: [
      {
        label: "Web Development",
        icon: "code",
        target: "/services/web-development",
      },
      {
        label: "App Development",
        icon: "phone_android",
        target: "/services/app-development",
      },
    ],
  },
  {
    label: "Portfolio",
    icon: "work",
    target: "/portfolio",
  },
  {
    label: "Blog",
    icon: "article",
    target: "/blog",
  },
];

export const FlatMenu = Template.bind({});
FlatMenu.args = {
  menuItems: flatMenuItems,
};

export const NestedMenu = Template.bind({});
NestedMenu.args = {
  menuItems: nestedMenuItems,
};
