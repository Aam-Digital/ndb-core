import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { Child } from "../../../../child-dev-project/children/model/child";
import { Database } from "../../../database/database";
import { BackupService } from "../../../admin/services/backup.service";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { ChildrenService } from "../../../../child-dev-project/children/children.service";
import { BehaviorSubject } from "rxjs";
import { EntitySelectComponent } from "./entity-select.component";
import { ChildrenModule } from "../../../../child-dev-project/children/children.module";
import { EntityUtilsModule } from "../entity-utils.module";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";

const child1 = new Child();
child1.name = "First Child";
child1.projectNumber = "1";
child1.photo = {
  path: "",
  photo: new BehaviorSubject("assets/child.png"),
};
const child2 = new Child();
child2.name = "Second Child";
child2.projectNumber = "2";
child2.photo = {
  path: "",
  photo: new BehaviorSubject("assets/child.png"),
};
const child3 = new Child();
child3.name = "Third Child";
child3.projectNumber = "3";
child3.photo = {
  path: "",
  photo: new BehaviorSubject("assets/child.png"),
};

export default {
  title: "Core/EntityComponents/EntitySelect",
  component: EntitySelectComponent,
  decorators: [
    moduleMetadata({
      imports: [EntityUtilsModule, StorybookBaseModule, ChildrenModule],
      declarations: [],
      providers: [
        { provide: BackupService, useValue: {} },
        {
          provide: EntityMapperService,
          useValue: {
            loadType: () => Promise.resolve([child1, child2, child3]),
          },
        },
        { provide: Database, useValue: {} },
        { provide: ChildrenService, useValue: {} },
      ],
    }),
  ],
} as Meta;

const Template: Story<EntitySelectComponent<Child>> = (
  args: EntitySelectComponent<Child>
) => ({
  component: EntitySelectComponent,
  props: args,
});

export const primary = Template.bind({});
primary.args = {
  entityType: Child.ENTITY_TYPE,
  label: "Attending Children",
  placeholder: "Select Children",
};

export const disabled = Template.bind({});
disabled.args = {
  entityType: Child.ENTITY_TYPE,
  label: "Attending Children",
  placeholder: "Select Children",
  selection: [child1.getId()],
  disabled: true,
};
