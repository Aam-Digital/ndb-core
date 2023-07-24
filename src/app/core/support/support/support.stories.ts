import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "app/utils/storybook-base.module";
import { SupportComponent } from "./support.component";
import { SwUpdate } from "@angular/service-worker";
import { Database } from "../../database/database";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { mockEntityMapper } from "../../entity/mock-entity-mapper-service";
import { UpdateManagerService } from "../../latest-changes/update-manager.service";

// TODO: fix layout of SupportComponent buttons on mobile

export default {
  title: "Core/> App Layout/Support",
  component: SupportComponent,
  decorators: [
    moduleMetadata({
      imports: [SupportComponent, StorybookBaseModule, HttpClientTestingModule],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        {
          provide: UpdateManagerService,
          useValue: {
            notifyUserWhenUpdateAvailable: () => {},
            regularlyCheckForUpdates: () => {},
            detectUnrecoverableState: () => {},
          },
        },
        { provide: SwUpdate, useValue: { isEnabled: true } },
        {
          provide: Database,
          useValue: {
            getPouchDB: () => ({
              info: async () => ({ doc_count: 2, update_seq: 33 }),
            }),
          },
        },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<SupportComponent> = (args: SupportComponent) => ({
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
