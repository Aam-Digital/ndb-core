import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { CommonModule } from "@angular/common";
import { RouterTestingModule } from "@angular/router/testing";
import { ReportingComponent } from "./reporting.component";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { MatTableModule } from "@angular/material/table";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatStepperModule } from "@angular/material/stepper";
import { MatIconModule } from "@angular/material/icon";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { ReportingService } from "../reporting.service";
import { MatNativeDateModule } from "@angular/material/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeIconsModule } from "../../../core/icons/font-awesome-icons.module";
import { AdminModule } from "../../../core/admin/admin.module";
import { Database } from "../../../core/database/database";
import { MockDatabase } from "../../../core/database/mock-database";

const reportingService = {
  setAggregations: () => null,
  calculateReport: () => {
    console.log("called");
    return Promise.resolve([
      { label: "Schools", result: 10 },
      { label: "Private Schools", result: 3 },
      { label: "Government Schools", result: 7 },
      { label: "Students", result: 120 },
      { label: "Male Students", result: 54 },
      { label: "Female Students", result: 76 },
    ]);
  },
};

export default {
  title: "Child Dev Project/Reporting",
  component: ReportingComponent,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        RouterTestingModule,
        MatButtonModule,
        MatListModule,
        MatTableModule,
        MatExpansionModule,
        MatStepperModule,
        MatIconModule,
        MatDatepickerModule,
        MatFormFieldModule,
        FormsModule,
        MatNativeDateModule,
        BrowserAnimationsModule,
        FontAwesomeIconsModule,
        AdminModule,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { data: of({}) } },
        { provide: ReportingService, useValue: reportingService },
        { provide: Database, useClass: MockDatabase },
      ],
    }),
  ],
} as Meta;

const Template: Story<ReportingComponent> = (args: ReportingComponent) => ({
  component: ReportingComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
