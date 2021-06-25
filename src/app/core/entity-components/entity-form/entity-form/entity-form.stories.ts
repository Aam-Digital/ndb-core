import { moduleMetadata } from "@storybook/angular";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { AlertService } from "../../../alerts/alert.service";
import { ChildPhotoService } from "../../../../child-dev-project/children/child-photo-service/child-photo.service";
import { SessionService } from "../../../session/session-service/session.service";
import { Child } from "../../../../child-dev-project/children/model/child";
import { RouterTestingModule } from "@angular/router/testing";
import { User } from "../../../user/user";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { EntityPermissionsService } from "../../../permissions/entity-permissions.service";
import { ChildrenModule } from "../../../../child-dev-project/children/children.module";
import { Router } from "@angular/router";
import { EntityFormModule } from "../entity-form.module";
import { EntityFormComponent } from "./entity-form.component";

export default {
  title: "Core/EntityComponents/EntityForm",
  component: EntityFormComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntityFormModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        ChildrenModule,
      ],
      providers: [
        { provide: EntityMapperService, useValue: { save: () => null } },
        {
          provide: AlertService,
          useValue: { addDanger: () => null, addInfo: () => null },
        },
        { provide: ChildPhotoService, useValue: { canSetImage: () => true } },
        {
          provide: SessionService,
          useValue: { getCurrentUser: () => new User() },
        },
        {
          provide: EntityPermissionsService,
          useValue: { userIsPermitted: () => true },
        },
        {
          provide: Router,
          useValue: {
            navigate: () => null,
            parseUrl: () => {
              return {};
            },
          },
        },
      ],
    }),
  ],
} as Meta;

const cols = [
  [
    {
      id: "photo",
    },
  ],
  [
    {
      id: "name",
      required: true,
    },
    {
      edit: "EditLongText",
      id: "additionalInfo",
      label: "Additional information",
    },
    {
      edit: "EditBoolean",
      id: "active",
      label: "Is active",
    },
    { id: "gender" },
  ],
  [
    {
      edit: "EditConfigurableEnum",
      id: "has_rationCard",
      label: "Ration Card Status",
      additional: "document-status",
    },
    {
      id: "admissionDate",
    },
    {
      id: "dateOfBirth",
    },
  ],
];

const Template: Story<EntityFormComponent> = (args: EntityFormComponent) => ({
  component: EntityFormComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entity: new Child(),
  columns: cols,
  creatingNew: true,
};
