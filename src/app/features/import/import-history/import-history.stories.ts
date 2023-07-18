import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportHistoryComponent } from "./import-history.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";
import { TEST_USER } from "../../../utils/mocked-testing.module";
import { User } from "../../../core/user/user";
import { IMPORT_SAMPLE_PREVIOUS_IMPORTS } from "../import/import-sample-raw-data";

export default {
  title: "Features/Import/Import History",
  component: ImportHistoryComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, ImportHistoryComponent],
      providers: [
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper([
            ...IMPORT_SAMPLE_PREVIOUS_IMPORTS,
            Object.assign(new User(TEST_USER), { name: TEST_USER }),
          ]),
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<ImportHistoryComponent> = (
  args: ImportHistoryComponent
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {};
