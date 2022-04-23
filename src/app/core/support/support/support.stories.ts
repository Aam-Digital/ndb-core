import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "app/utils/storybook-base.module";
import { SupportComponent } from "./support.component";
import { SupportModule } from "../support.module";
import { SessionService } from "../../session/session-service/session.service";
import { BehaviorSubject } from "rxjs";
import { SyncState } from "../../session/session-states/sync-state.enum";
import { WINDOW_TOKEN } from "../../../utils/di-tokens";
import { SwUpdate } from "@angular/service-worker";

export default {
  title: "Core/Support",
  component: SupportComponent,
  decorators: [
    moduleMetadata({
      imports: [SupportModule, StorybookBaseModule],
      providers: [
        { provide: WINDOW_TOKEN, useValue: window },
        {
          provide: SessionService,
          useValue: {
            getCurrentUser: () => ({ name: "demo-user" }),
            syncState: new BehaviorSubject(SyncState.COMPLETED),
          },
        },
        { provide: SwUpdate, useValue: { isEnabled: true } },
      ],
    }),
  ],
} as Meta;

const Template: Story<SupportComponent> = (args: SupportModule) => ({
  component: SupportComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
