import { moduleMetadata } from "@storybook/angular";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { AlertService } from "../../../alerts/alert.service";
import { ChildPhotoService } from "../../../../child-dev-project/children/child-photo-service/child-photo.service";
import { Child } from "../../../../child-dev-project/children/model/child";
import { RouterTestingModule } from "@angular/router/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { EntityPermissionsService } from "../../../permissions/entity-permissions.service";
import { ChildrenModule } from "../../../../child-dev-project/children/children.module";
import { Router } from "@angular/router";
import { EntityFormModule } from "../entity-form.module";
import { EntityFormComponent } from "./entity-form.component";
import { School } from "../../../../child-dev-project/schools/model/school";
import { MockSessionModule } from "../../../session/mock-session.module";
import { MatNativeDateModule } from "@angular/material/core";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

const s1 = new School();
s1.name = "First School";
const s2 = new School();
s2.name = "Second School";
const s3 = new School();
s3.name = "Third School";

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
        MockSessionModule.withState(),
        MatNativeDateModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        {
          provide: EntityMapperService,
          useValue: {
            save: () => Promise.resolve(),
            loadType: () => Promise.resolve([s1, s2, s3]),
          },
        },
        {
          provide: AlertService,
          useValue: { addDanger: () => null, addInfo: () => null },
        },
        { provide: ChildPhotoService, useValue: { canSetImage: () => true } },
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
      id: "projectNumber",
      edit: "EditNumber",
    },
    {
      edit: "EditLongText",
      id: "status",
      label: "Additional information",
    },
    { id: "gender" },
  ],
  [
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
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
    {
      id: "assignedTo",
      edit: "EditEntityArray",
      view: "DisplayEntityArray",
      additional: "School",
      label: "Assigned school(s)",
    },
  ],
  ["school"],
];

Child.schema.set("has_rationCard", {
  dataType: "configurable-enum",
  innerDataType: "document-status",
});
Child.schema.set("assignedTo", { dataType: "array", innerDataType: "string" });
Child.schema.set("school", {
  dataType: "string",
  label: "Assigned School",
  additional: School.ENTITY_TYPE,
  viewComponent: "DisplayEntity",
  editComponent: "EditSingleEntity",
});

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
