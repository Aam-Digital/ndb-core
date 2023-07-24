import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { CommonModule } from "@angular/common";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { NotFoundComponent } from "./not-found.component";
import { MatButtonModule } from "@angular/material/button";

export default {
  title: "Core/> App Layout/Error Page Not Found",
  component: NotFoundComponent,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, StorybookBaseModule, MatButtonModule],
    }),
  ],
} as Meta;

const Template: StoryFn<NotFoundComponent> = (args: NotFoundComponent) => ({
  component: NotFoundComponent,
  props: args,
});

export const Primary = Template.bind({});
