import { moduleMetadata } from "@storybook/angular";
import { CommonModule } from "@angular/common";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { Story, Meta } from "@storybook/angular/types-6-0";
import { NotFoundComponent } from "./not-found.component";
import { MatButtonModule } from "@angular/material/button";

export default {
  title: "Core/404 Not Found Page",
  component: NotFoundComponent,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, StorybookBaseModule, MatButtonModule],
    }),
  ],
} as Meta;

const Template: Story<NotFoundComponent> = (args: NotFoundComponent) => ({
  component: NotFoundComponent,
  props: args,
});

export const Primary = Template.bind({});
