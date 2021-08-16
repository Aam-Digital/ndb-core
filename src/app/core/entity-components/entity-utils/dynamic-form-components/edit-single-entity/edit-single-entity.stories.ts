import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { BehaviorSubject } from "rxjs";
import { RouterTestingModule } from "@angular/router/testing";
import { BackupService } from "../../../../admin/services/backup.service";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { ChildrenModule } from "../../../../../child-dev-project/children/children.module";
import { Database } from "../../../../database/database";
import { ChildrenService } from "../../../../../child-dev-project/children/children.service";
import { Child } from "../../../../../child-dev-project/children/model/child";
import { CloudFileService } from "../../../../webdav/cloud-file-service.service";
import { EntityUtilsModule } from "../../entity-utils.module";
import { EditSingleEntityComponent } from "./edit-single-entity.component";
import { FormControl, FormGroup } from "@angular/forms";

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
        NoopAnimationsModule,
        RouterTestingModule,
        ChildrenModule,
      ],
      declarations: [],
      providers: [
        { provide: BackupService, useValue: {} },
        { provide: CloudFileService, useValue: {} },
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

const Template: Story<EditSingleEntityComponent> = (
  args: EditSingleEntityComponent
) => ({
  component: EditSingleEntityComponent,
  props: args,
});

const formGroup = new FormGroup({child:new FormControl()
  })
formGroup.get("child").enable();

export const primary = Template.bind({});
primary.args = {
  entityType: Child.ENTITY_TYPE,
  label: "child",
  formControl: formGroup.get("child"),
  formControlName: "child",
  entities: [child1, child2, child3],
  placeholder: "add child"
};
