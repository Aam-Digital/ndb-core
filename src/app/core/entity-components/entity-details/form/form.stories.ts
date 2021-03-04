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
        { provide: EntityMapperService, useValue: {} },
        { provide: AlertService, useValue: {} },
        { provide: ChildPhotoService, useValue: { canSetImage: () => true } },
        {
          provide: SessionService,
          useValue: { getCurrentUser: () => new User() },
        },
        {
          provide: EntityPermissionsService,
          useValue: { userIsPermitted: () => false },
        },
      ],
    }),
  ],
} as Meta;

const testConfig = {
  cols: [
    [
      {
        input: "text",
        id: "name",
        placeholder: "Name",
        required: true,
      },
      {
        input: "select",
        id: "health_vaccinationStatus",
        placeholder: "Peter Status",
        options: [
          "Good",
          "Vaccination Due",
          "Needs Checking",
          "No Card/Information",
        ],
      },
    ],
    [
      {
        input: "select",
        id: "health_eyeHealthStatus",
        placeholder: "Eye Status",
        options: ["Good", "Has Glasses", "Needs Glasses", "Needs Checkup"],
      },
    ],
    [
      {
        input: "text",
        id: "health_bloodGroup",
        placeholder: "Blood Group",
      },
    ],
    [
      {
        input: "datepicker",
        id: "health_lastDentalCheckup",
        placeholder: "Last Dental Check-Up",
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
};
