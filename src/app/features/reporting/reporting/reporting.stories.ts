import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { ReportingComponent } from "./reporting.component";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { DataAggregationService } from "../data-aggregation.service";
import { genders } from "../../../child-dev-project/children/model/genders";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { DataTransformationService } from "app/core/export/data-transformation-service/data-transformation.service";
import { DownloadService } from "../../../core/export/download-service/download.service";

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
  title: "Features/Reporting/Report",
  component: ReportingComponent,
  decorators: [
    moduleMetadata({
      imports: [ReportingComponent, StorybookBaseModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ config: { reports: [{ title: "Dummy Report" }] } }),
          },
        },
        { provide: DataAggregationService, useValue: reportingService },
        {
          provide: DataTransformationService,
          useValue: { queryAndTransformData: () => {} },
        },
        {
          provide: DownloadService,
          useValue: { triggerDownload: () => {} },
        },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<ReportingComponent> = (args: ReportingComponent) => ({
  component: ReportingComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
