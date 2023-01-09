import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "app/utils/storybook-base.module";
import { SupportComponent } from "./support.component";
import { SessionService } from "../../session/session-service/session.service";
import { BehaviorSubject } from "rxjs";
import { SyncState } from "../../session/session-states/sync-state.enum";
import { LOCATION_TOKEN, WINDOW_TOKEN } from "../../../utils/di-tokens";
import { SwUpdate } from "@angular/service-worker";
import { Database } from "../../database/database";
import { HttpClientTestingModule } from "@angular/common/http/testing";

export default {
  title: "Core/Support",
  component: SupportComponent,
  decorators: [
    moduleMetadata({
      imports: [SupportComponent, StorybookBaseModule, HttpClientTestingModule],
      providers: [
        { provide: WINDOW_TOKEN, useValue: window },
        { provide: LOCATION_TOKEN, useValue: window.location },
        {
          provide: SessionService,
          useValue: {
            getCurrentUser: () => ({ name: "demo-user" }),
            syncState: new BehaviorSubject(SyncState.COMPLETED),
          },
        },
        { provide: SwUpdate, useValue: { isEnabled: true } },
        { provide: Database, useValue: {} },
      ],
    }),
  ],
} as Meta;

const Template: Story<SupportComponent> = (args: SupportComponent) => ({
  component: SupportComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  swLog:
    "Driver state: EXISTING_CLIENTS_ONLY (Degraded due to: Failed to retrieve hashed resource from the server. (AssetGroup: app | URL: /en-US/5-es2018.d3b9afcd0ff579cd92db.js)\n" +
    "Error: Failed to retrieve hashed resource from the server. (AssetGroup: app | URL: /en-US/5-es2018.d3b9afcd0ff579cd92db.js)\n" +
    "    at v.<anonymous> (http://localhost:4200/ngsw-worker.js:1:6961)\n" +
    "    at Generator.next (<anonymous>)\n" +
    "    at a (http://localhost:4200/ngsw-worker.js:1:677))\n" +
    "Latest manifest hash: c34ebeaec06c44a5b9bc813cf3f340694261a014\n" +
    "Last update check: 3m21s250u\n" +
    "\n" +
    "=== Version c34ebeaec06c44a5b9bc813cf3f340694261a014 ===\n" +
    "\n" +
    "Clients: \n" +
    "\n" +
    "=== Idle Task Queue ===\n" +
    "Last update tick: 9u\n" +
    "Last update run: 3m21s567u\n" +
    "Task queue:\n" +
    " * check-updates-on-navigation\n" +
    "\n" +
    "Debug log:\n" +
    "\n" +
    "[35m24s144u] Error(Failed to retrieve hashed resource from the server. (AssetGroup: app | URL: /en-US/5-es2018.d3b9afcd0ff579cd92db.js), Error: Failed to retrieve hashed resource from the server. (AssetGroup: app | URL: /en-US/5-es2018.d3b9afcd0ff579cd92db.js)\n" +
    "    at v.<anonymous> (http://localhost:4200/ngsw-worker.js:1:6961)\n" +
    "    at Generator.next (<anonymous>)\n" +
    "    at a (http://localhost:4200/ngsw-worker.js:1:677)) initializeFully for c34ebeaec06c44a5b9bc813cf3f340694261a014\n" +
    "[19m44s317u] TypeError(Failed to fetch, TypeError: Failed to fetch\n" +
    "    at Object.<anonymous> (http://localhost:4200/ngsw-worker.js:1:36322)\n" +
    "    at Generator.next (<anonymous>)\n" +
    "    at http://localhost:4200/ngsw-worker.js:1:873\n" +
    "    at new Promise (<anonymous>)\n" +
    "    at i (http://localhost:4200/ngsw-worker.js:1:621)\n" +
    "    at Object.safeFetch (http://localhost:4200/ngsw-worker.js:1:36261)\n" +
    "    at Object.<anonymous> (http://localhost:4200/ngsw-worker.js:1:27309)\n" +
    "    at Generator.next (<anonymous>)\n" +
    "    at a (http://localhost:4200/ngsw-worker.js:1:677)) Driver.fetch(http://localhost:4200/sockjs-node/info?t=1650967704796)\n",
};
