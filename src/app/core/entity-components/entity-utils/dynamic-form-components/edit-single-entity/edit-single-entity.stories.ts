import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { BehaviorSubject } from "rxjs";
import { BackupService } from "../../../../admin/services/backup.service";
import { ChildrenModule } from "../../../../../child-dev-project/children/children.module";
import { Child } from "../../../../../child-dev-project/children/model/child";
import { CloudFileService } from "../../../../webdav/cloud-file-service.service";
import { EntityUtilsModule } from "../../entity-utils.module";
import { EditSingleEntityComponent } from "./edit-single-entity.component";
import { FormControl, FormGroup } from "@angular/forms";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { MockSessionModule } from "../../../../session/mock-session.module";
import { LoginState } from "../../../../session/session-states/login-state.enum";

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
  title: "Core/EntityComponents/EditSingleEntity",
  component: EditSingleEntityComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntityUtilsModule,
        StorybookBaseModule,
        ChildrenModule,
        MockSessionModule.withState(LoginState.LOGGED_IN, [
          child1,
          child2,
          child3,
        ]),
      ],
      providers: [
        { provide: BackupService, useValue: {} },
        { provide: CloudFileService, useValue: {} },
      ],
    }),
  ],
} as Meta;

const Template: Story<EditSingleEntityComponent> = (
  args: EditSingleEntityComponent
) => ({
  component: EditSingleEntityComponent,
  props: args,
});

const formGroup = new FormGroup({ child: new FormControl() });
formGroup.get("child").enable();

export const primary = Template.bind({});
primary.args = {
  // entityType: Child.ENTITY_TYPE,
  // label: "child",
  // formControl: formGroup.get("child"),
  // formControlName: "child",
  // entities: [child1, child2, child3],
  // placeholder: "add child",
};
