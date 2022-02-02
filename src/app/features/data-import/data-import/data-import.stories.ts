import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { DataImportModule } from "../data-import.module";
import { DataImportComponent } from "./data-import.component";
import { DataImportService } from "../data-import.service";
import { DynamicEntityService } from "../../../core/entity/dynamic-entity.service";
import { Child } from "../../../child-dev-project/children/model/child";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { PouchDatabase } from "../../../core/database/pouch-database";
import { Database } from "../../../core/database/database";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { BackupService } from "../../../core/admin/services/backup.service";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { QueryService } from "../../reporting/query.service";

let mockEntityMap: Map<string, EntityConstructor>;
mockEntityMap = new Map<"Participant", EntityConstructor<Child>>();

export default {
  title: "Features/DataImport",
  component: DataImportComponent,
  decorators: [
    moduleMetadata({
      imports: [
        DataImportModule,
        FontAwesomeTestingModule,
        MatDialogModule,
        MatSnackBarModule,
      ],
      declarations: [],
      providers: [
        DataImportService,
        ConfirmationDialogService,
        { provide: Database, useValue: PouchDatabase.createWithInMemoryDB() },
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
        {
          provide: DynamicEntityService,
          useValue: new DynamicEntityService(undefined, undefined),
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
