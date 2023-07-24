import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ChangelogComponent } from "./changelog.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { UpdateManagerService } from "../update-manager.service";
import { Changelog } from "../changelog";
import { of } from "rxjs";

const changelogs: Changelog[] = [
  {
    tag_name: "3.9.0",
    name: "3.9.0",
    published_at: "2022-08-15T18:38:37Z",
    body: "### Bug Fixes\r\n\r\n* .caching of language files ([#1394](https://github.com/Aam-Digital/ndb-core/issues/1394)) ([4cf8122](https://github.com/Aam-Digital/ndb-core/commit/4cf81224733024bb0afefc26f6937ff4d2eadc80))\r\n* .demo mode can be deactivated with `config.json` ([#1395](https://github.com/Aam-Digital/ndb-core/issues/1395)) ([d8f48ae](https://github.com/Aam-Digital/ndb-core/commit/d8f48ae44cda53b6bb9e48b4782ad226c20b1c91))\r\n* permissions are correctly applied in popup form ([#1387](https://github.com/Aam-Digital/ndb-core/issues/1387)) ([2663b15](https://github.com/Aam-Digital/ndb-core/commit/2663b15364c5e6b1b377d8b909fe72f00857ce7d))\r\n* .starting demo mode when host includes `demo` ([#1386](https://github.com/Aam-Digital/ndb-core/issues/1386)) ([261c288](https://github.com/Aam-Digital/ndb-core/commit/261c2887b3132afcf5c44bf139a6cd6295ade925))\r\n* .support assets requests with a locale ([#1397](https://github.com/Aam-Digital/ndb-core/issues/1397)) ([5cd2e5d](https://github.com/Aam-Digital/ndb-core/commit/5cd2e5d116eba55fea3c9fd19469ed7501dae6cb))\r\n* translations are loaded at runtime ([#1218](https://github.com/Aam-Digital/ndb-core/issues/1218)) ([08222ce](https://github.com/Aam-Digital/ndb-core/commit/08222ce9a5a33156a6c74985fa868737d0a85b56)), closes [#1356](https://github.com/Aam-Digital/ndb-core/issues/1356)\r\n* .typo in config settings retrieval ([f56c7e4](https://github.com/Aam-Digital/ndb-core/commit/f56c7e42e0b49f03d4f1c5e9f5a6091b1df1021f))\r\n\r\n\r\n### Features\r\n\r\n* .Removed config.json and related things ([#1319](https://github.com/Aam-Digital/ndb-core/issues/1319)) ([ca3704a](https://github.com/Aam-Digital/ndb-core/commit/ca3704aa4c6ec741735931aabe508e417ae6651a)), closes [#841](https://github.com/Aam-Digital/ndb-core/issues/841)\r\n\r\n\r\n\r\n",
  },
  {
    tag_name: "3.8.3",
    name: "3.8.3",
    published_at: "2022-07-19T10:12:56Z",
    body: "### Bug Fixes\n\n* entity blocks look and feel more consistent ([#1370](https://github.com/Aam-Digital/ndb-core/issues/1370)) ([27542ad](https://github.com/Aam-Digital/ndb-core/commit/27542ad2833fa43f767f21032f7bc6f51e0a1566))\n* legacy date values are correctly parsed ([#1377](https://github.com/Aam-Digital/ndb-core/issues/1377)) ([2fd2cf4](https://github.com/Aam-Digital/ndb-core/commit/2fd2cf48034ac28a7ae1ea6e903b7afecbc4b48a))\n* tables adjust to mobile view ([#1371](https://github.com/Aam-Digital/ndb-core/issues/1371)) ([8b082dc](https://github.com/Aam-Digital/ndb-core/commit/8b082dcc00538b5c71914b3c01ccdbf08e4bdd88))",
  },
  {
    tag_name: "3.8.2",
    name: "3.8.2",
    published_at: "2022-07-15T09:37:17Z",
    body: "### Bug Fixes\n\n* added logging for not-found component ([#1358](https://github.com/Aam-Digital/ndb-core/issues/1358)) ([6781b33](https://github.com/Aam-Digital/ndb-core/commit/6781b3347f4b4d87dcab3922ae09f039fc697942))\n* app doesn't break if a component in the config does not exist ([eb419e6](https://github.com/Aam-Digital/ndb-core/commit/eb419e6c8e69b5b99e0e62a658bbe56564a07e93))\n* **core:** using correct timezone when parsing dates ([#1355](https://github.com/Aam-Digital/ndb-core/issues/1355)) ([4d6e403](https://github.com/Aam-Digital/ndb-core/commit/4d6e4035090996d6b309233e8c887cd52a63664a))\n* enabled support and user account component for everyone ([7c0374e](https://github.com/Aam-Digital/ndb-core/commit/7c0374e80265af7a8489b8e4a5d57875eaaa20e9))\n\n\n\n",
  },
];

export default {
  title: "Core/Changelog",
  component: ChangelogComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, ChangelogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: of(changelogs) },
        {
          provide: UpdateManagerService,
          useValue: {
            notifyUserWhenUpdateAvailable: () => {},
            regularlyCheckForUpdates: () => {},
            detectUnrecoverableState: () => {},
          },
        },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<ChangelogComponent> = (args: ChangelogComponent) => ({
  component: ChangelogComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
