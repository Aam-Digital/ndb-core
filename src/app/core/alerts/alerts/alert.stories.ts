import { moduleMetadata } from "@storybook/angular";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { AlertComponent } from "./alert.component";
import { MAT_SNACK_BAR_DATA } from "@angular/material/snack-bar";
import { Alert } from "../alert";
import { AlertDisplay } from "../alert-display";

export default {
  title: "Alert/Component",
  component: AlertComponent,
  decorators: [
    moduleMetadata({
      imports: [],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<AlertComponent> = (args: AlertComponent) => ({
  component: AlertComponent,
  props: args,
});

export const Info = Template.bind({});
Info.decorators = [
  moduleMetadata({
    providers: [
      {
        provide: MAT_SNACK_BAR_DATA,
        useValue: new Alert(
          "For your Information",
          Alert.INFO,
          AlertDisplay.PERSISTENT
        ),
      },
    ],
  }),
];

export const Warning = Template.bind({});
Warning.decorators = [
  moduleMetadata({
    providers: [
      {
        provide: MAT_SNACK_BAR_DATA,
        useValue: new Alert("Warning!", Alert.WARNING, AlertDisplay.PERSISTENT),
      },
    ],
  }),
];

export const Danger = Template.bind({});
Danger.decorators = [
  moduleMetadata({
    providers: [
      {
        provide: MAT_SNACK_BAR_DATA,
        useValue: new Alert("Warning!", Alert.DANGER, AlertDisplay.PERSISTENT),
      },
    ],
  }),
];
