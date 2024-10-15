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
    link: "/",
    subMenu: [],
  },
  {
    label: "About",
    icon: "info",
    link: "/about",
  },
  {
    label: "Contact",
    icon: "contact",
    link: "/contact",
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
        link: "/services/web-development",
      },
      {
        label: "App Development",
        icon: "phone_android",
        link: "/services/app-development",
      },
    ],
  },
  {
    label: "Portfolio",
    icon: "work",
    link: "/portfolio",
  },
  {
    label: "Blog",
    icon: "article",
    link: "/blog",
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
