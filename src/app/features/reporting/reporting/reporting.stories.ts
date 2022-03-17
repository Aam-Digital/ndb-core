import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { ReportingComponent } from "./reporting.component";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { ReportingService } from "../reporting.service";
import { ReportingModule } from "../reporting.module";
import { genders } from "../../../child-dev-project/children/model/genders";
import { ExportService } from "../../../core/export/export-service/export.service";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";

const reportingService = {
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
              values: [genders[2]],
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
              values: [genders[1]],
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
  title: "Features/Reporting",
  component: ReportingComponent,
  decorators: [
    moduleMetadata({
      imports: [ReportingModule, StorybookBaseModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ config: { reports: [{ title: "Dummy Report" }] } }),
          },
        },
        { provide: ReportingService, useValue: reportingService },
        {
          provide: ExportService,
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
