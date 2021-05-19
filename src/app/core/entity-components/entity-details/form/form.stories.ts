import { FormComponent } from "./form.component";
import { moduleMetadata } from "@storybook/angular";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { AlertService } from "../../../alerts/alert.service";
import { ChildPhotoService } from "../../../../child-dev-project/children/child-photo-service/child-photo.service";
import { SessionService } from "../../../session/session-service/session.service";
import { EntityDetailsModule } from "../entity-details.module";
import { Child } from "../../../../child-dev-project/children/model/child";
import { RouterTestingModule } from "@angular/router/testing";
import { User } from "../../../user/user";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { EntityPermissionsService } from "../../../permissions/entity-permissions.service";
import { ChildrenModule } from "../../../../child-dev-project/children/children.module";
import { Router } from "@angular/router";

export default {
  title: "Core/Form",
  component: FormComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntityDetailsModule,
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

const testConfig = {
  cols: [
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
        input: "EditLongText",
        id: "additionalInfo",
        placeholder: "Additional information",
      },
      {
        input: "EditBoolean",
        id: "active",
        placeholder: "Is active",
      },
      { id: "gender" },
      {
        input: "EditSelectable",
        id: "health_vaccinationStatus",
        placeholder: "Vaccination Status",
        additional: [
          "Good",
          "Vaccination Due",
          "Needs Checking",
          "No Card/Information",
        ],
      },
    ],
    [
      {
        input: "EditConfigurableEnum",
        id: "has_rationCard",
        placeholder: "Ration Card Status",
        additional: "document-status",
      },
      {
        id: "admissionDate",
      },
      {
        id: "dateOfBirth",
      },
    ],
  ],
};

const Template: Story<FormComponent> = (args: FormComponent) => ({
  component: FormComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entity: new Child(),
  config: testConfig,
  creatingNew: true,
};
