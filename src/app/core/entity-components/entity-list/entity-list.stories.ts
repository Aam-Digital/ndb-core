import { moduleMetadata } from "@storybook/angular";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { EntityListComponent } from "./entity-list.component";
import { EntityListModule } from "./entity-list.module";
import { Child } from "../../../child-dev-project/children/model/child";
import { DemoChildGenerator } from "../../../child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { SessionService } from "../../session/session-service/session.service";
import { User } from "../../user/user";
import { RouterTestingModule } from "@angular/router/testing";
import { BackupService } from "../../admin/services/backup.service";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { Angulartics2Module } from "angulartics2";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ConfigurableEnumModule } from "../../configurable-enum/configurable-enum.module";
import { DatePipe } from "@angular/common";

const user = new User();
user.paginatorSettingsPageSize["ageprojectNumbernamegendercenterstatus"] = 13;

export default {
  title: "Core/Entity List",
  component: EntityListComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntityListModule,
        RouterTestingModule,
        Angulartics2Module.forRoot(),
        BrowserAnimationsModule,
        ConfigurableEnumModule,
      ],
      providers: [
        DatePipe,
        {
          provide: SessionService,
          useValue: { getCurrentUser: () => user },
        },
        { provide: BackupService, useValue: {} },
        {
          provide: EntityMapperService,
          useValue: { save: () => Promise.resolve() },
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<EntityListComponent<Child>> = (
  args: EntityListComponent<Child>
) => ({
  component: EntityListComponent,
  props: args,
});

const children = new DemoChildGenerator({ count: 25 }).generateEntities();

export const Primary = Template.bind({});
Primary.args = {
  allEntities: children,
  entityConstructor: Child,
  listConfig: {
    title: "Children List",
    columns: [{ id: "age", label: "Age", view: "DisplayText" }],
    columnGroups: {
      mobile: "Mobile",
      default: "Normal",
      groups: [
        {
          name: "Normal",
          columns: [
            "projectNumber",
            "name",
            "age",
            "gender",
            "center",
            "status",
          ],
        },
        {
          name: "Mobile",
          columns: ["projectNumber", "name", "age"],
        },
      ],
    },
    filters: [
      {
        id: "isActive",
        type: "boolean",
        default: "true",
        true: "Active Children",
        false: "Inactive",
        all: "All",
      },
      {
        id: "center",
        label: "Center",
        type: "configurable-enum",
        enumId: "center",
        display: "dropdown",
      },
    ],
  },
};
