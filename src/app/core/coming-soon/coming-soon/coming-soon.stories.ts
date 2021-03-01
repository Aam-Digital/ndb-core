import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { FontAwesomeIconsModule } from "../../icons/font-awesome-icons.module";
import { ComingSoonComponent } from "./coming-soon.component";
import { ComingSoonModule } from "../coming-soon.module";
import { AlertsModule } from "../../alerts/alerts.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Angulartics2RouterlessModule } from "angulartics2/routerlessmodule";
import { RouterModule } from "@angular/router";

export default {
  title: "Core/ComingSoonPage",
  component: ComingSoonComponent,
  decorators: [
    moduleMetadata({
      imports: [
        ComingSoonModule,
        AlertsModule,
        FontAwesomeIconsModule,
        BrowserAnimationsModule,
        RouterModule,
        Angulartics2RouterlessModule.forRoot(),
      ],
    }),
  ],
} as Meta;

const Template: Story<ComingSoonComponent> = (args: ComingSoonComponent) => ({
  component: ComingSoonComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
