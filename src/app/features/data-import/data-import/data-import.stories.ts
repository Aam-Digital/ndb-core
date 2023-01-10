import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { DataImportComponent } from "./data-import.component";
import { DataImportService } from "../data-import.service";
import { Child } from "../../../child-dev-project/children/model/child";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { PouchDatabase } from "../../../core/database/pouch-database";
import { Database } from "../../../core/database/database";
import { BackupService } from "../../../core/admin/services/backup.service";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { QueryService } from "../../../core/export/query.service";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";

let mockEntityMap: Map<string, EntityConstructor>;
mockEntityMap = new Map<"Participant", EntityConstructor<Child>>();

export default {
  title: "Features/DataImport",
  component: DataImportComponent,
  decorators: [
    moduleMetadata({
      imports: [DataImportComponent, StorybookBaseModule],
      declarations: [],
      providers: [
        DataImportService,
        ConfirmationDialogService,
        { provide: Database, useValue: PouchDatabase.create() },
        {
          provide: BackupService,
          useValue: {
            getJsonExport: () => Promise.resolve(),
            clearDatabase: () => Promise.resolve(),
            importJson: () => Promise.resolve(),
          },
        },
        {
          provide: QueryService,
          useValue: {
            queryData: () => undefined,
          },
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<DataImportComponent> = (args: DataImportComponent) => ({
  component: DataImportComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
