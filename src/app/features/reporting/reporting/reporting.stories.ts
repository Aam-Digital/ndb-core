import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RouterTestingModule } from "@angular/router/testing";
import { ReportingComponent } from "./reporting.component";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { ReportingService } from "../reporting.service";
import { MatNativeDateModule } from "@angular/material/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeIconsModule } from "../../../core/icons/font-awesome-icons.module";
import { BackupService } from "../../../core/admin/services/backup.service";
import { Gender } from "../../../child-dev-project/children/model/Gender";
import { ReportingModule } from "../reporting.module";

const reportingService = {
  setAggregations: () => null,
  calculateReport: () => {
    return Promise.resolve([
      {
        header: { label: "Total # of children", result: 4 },
        subRows: [
          {
            header: {
              label: "Total # of children",
              values: ["Alipore"],
              result: 3,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of children",
              values: ["Barabazar"],
              result: 1,
            },
            subRows: [],
          },
          {
            header: {
              label: "Total # of children",
              values: ["christian"],
              result: 3,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  values: ["Alipore"],
                  result: 2,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of children",
                  values: ["Barabazar"],
                  result: 1,
                },
                subRows: [],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              values: ["muslim"],
              result: 1,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  values: ["Alipore"],
                  result: 1,
                },
                subRows: [],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              values: [Gender.FEMALE],
              result: 2,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  values: ["Alipore"],
                  result: 1,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of children",
                  values: ["Barabazar"],
                  result: 1,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of children",
                  values: ["christian"],
                  result: 2,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of children",
                      values: ["Alipore"],
                      result: 1,
                    },
                    subRows: [],
                  },
                  {
                    header: {
                      label: "Total # of children",
                      values: ["Barabazar"],
                      result: 1,
                    },
                    subRows: [],
                  },
                ],
              },
            ],
          },
          {
            header: {
              label: "Total # of children",
              values: [Gender.MALE],
              result: 2,
            },
            subRows: [
              {
                header: {
                  label: "Total # of children",
                  values: ["Alipore"],
                  result: 2,
                },
                subRows: [],
              },
              {
                header: {
                  label: "Total # of children",
                  values: ["christian"],
                  result: 1,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of children",
                      values: ["Alipore"],
                      result: 1,
                    },
                    subRows: [],
                  },
                ],
              },
              {
                header: {
                  label: "Total # of children",
                  values: ["muslim"],
                  result: 1,
                },
                subRows: [
                  {
                    header: {
                      label: "Total # of children",
                      values: ["Alipore"],
                      result: 1,
                    },
                    subRows: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  },
};

export default {
  title: "Child Dev Project/Reporting",
  component: ReportingComponent,
  decorators: [
    moduleMetadata({
      imports: [
        ReportingModule,
        RouterTestingModule,
        MatNativeDateModule,
        BrowserAnimationsModule,
        FontAwesomeIconsModule,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { data: of({}) } },
        { provide: ReportingService, useValue: reportingService },
        {
          provide: BackupService,
          useValue: { createJson: () => {}, createCsv: () => {} },
        },
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
