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
import { TextfieldComponent } from "./edit-components/textfield/textfield.component";

export default {
  title: "Core/Form",
  component: FormComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntityDetailsModule,
        RouterTestingModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: EntityMapperService, useValue: { save: () => null } },
        { provide: AlertService, useValue: { addDanger: () => null } },
        { provide: ChildPhotoService, useValue: { canSetImage: () => true } },
        {
          provide: SessionService,
          useValue: { getCurrentUser: () => new User() },
        },
        {
          provide: EntityPermissionsService,
          useValue: { userIsPermitted: () => true },
        },
      ],
    }),
  ],
} as Meta;

const testConfig = {
  cols: [
    // [
    //   {
    //     input: "photo",
    //     id: "photoFile",
    //     placeholder: "Photo Filename",
    //   },
    // ],
    [
      {
        input: "TextfieldComponent",
        id: "name",
        placeholder: "Name",
        required: true,
      },
      // {
      //   input: "textarea",
      //   id: "additionalInfo",
      //   placeholder: "Additional information",
      // },
      // {
      //   input: "checkbox",
      //   id: "active",
      //   placeholder: "Is active",
      // },
      // {
      //   input: "select",
      //   id: "health_vaccinationStatus",
      //   placeholder: "Peter Status",
      //   options: [
      //     "Good",
      //     "Vaccination Due",
      //     "Needs Checking",
      //     "No Card/Information",
      //   ],
      // },
      // ],
      // [
      //   {
      //     input: "configurable-enum-select",
      //     id: "has_rationCard",
      //     placeholder: "Ration Card Status",
      //     enumId: "document-status",
      //   },
      //   {
      //     input: "datepicker",
      //     id: "health_lastDentalCheckup",
      //     placeholder: "Last Dental Check-Up",
      //   },
      //   {
      //     input: "age",
      //     id: "dateOfBirth",
      //     placeholder: "Date of Birth",
      //   },
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
  editing: true,
};
