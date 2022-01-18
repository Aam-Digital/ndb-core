import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { ComingSoonComponent } from "./coming-soon.component";
import { ComingSoonModule } from "../coming-soon.module";
import { AlertsModule } from "../../alerts/alerts.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Angulartics2RouterlessModule } from "angulartics2/routerlessmodule";
import { AnalyticsService } from "../../analytics/analytics.service";
import { RouterTestingModule } from "@angular/router/testing";

export default {
  title: "Core/ComingSoonPage",
  component: ComingSoonComponent,
  decorators: [
    moduleMetadata({
      imports: [
        ComingSoonModule,
        AlertsModule,
        BrowserAnimationsModule,
        RouterTestingModule,
        Angulartics2RouterlessModule.forRoot(),
      ],
      providers: [{ provide: AnalyticsService, useValue: {} }],
    }),
  ],
} as Meta;

const Template: Story<ComingSoonComponent> = (args: ComingSoonComponent) => ({
  component: ComingSoonComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
