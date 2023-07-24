import { ReportRowComponent } from "./report-row.component";
import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { ReportRow } from "../../report-row";
import { ReportingComponent } from "../reporting.component";

export default {
  title: "Features/Reporting/Report Row",
  component: ReportRowComponent,
  decorators: [
    moduleMetadata({
      imports: [ReportingComponent, StorybookBaseModule],
    }),
  ],
} as Meta;

const Template: StoryFn<ReportRowComponent> = (args: ReportRowComponent) => ({
  component: ReportRowComponent,
  props: args,
});

const demoData: ReportRow[] = JSON.parse(`
[
  {
    "header": {
      "label": "All children",
      "groupedBy": [],
      "result": 111
    },
    "subRows": [
      {
        "header": {
          "label": "All children",
          "groupedBy": [
            {
              "property": "gender",
              "value": {
                "id": "X",
                "label": "Non-binary/third gender"
              }
            }
          ],
          "result": 35
        },
        "subRows": []
      },
      {
        "header": {
          "label": "All children",
          "groupedBy": [
            {
              "property": "gender",
              "value": {
                "id": "F",
                "label": "female"
              }
            }
          ],
          "result": 32
        },
        "subRows": []
      },
      {
        "header": {
          "label": "All children",
          "groupedBy": [
            {
              "property": "gender",
              "value": {
                "id": "M",
                "label": "male"
              }
            }
          ],
          "result": 44
        },
        "subRows": []
      }
    ]
  },
  {
    "header": {
      "label": "All schools",
      "groupedBy": [],
      "result": 8
    },
    "subRows": [
      {
        "header": {
          "label": "Children attending a school",
          "groupedBy": [],
          "result": 119
        },
        "subRows": []
      },
      {
        "header": {
          "label": "Governmental schools",
          "groupedBy": [],
          "result": 4
        },
        "subRows": []
      },
      {
        "header": {
          "label": "Children attending a governmental school",
          "groupedBy": [],
          "result": 61
        },
        "subRows": [
          {
            "header": {
              "label": "Children attending a governmental school",
              "groupedBy": [
                {
                  "property": "gender",
                  "value": {
                    "id": "M",
                    "label": "male"
                  }
                }
              ],
              "result": 25
            },
            "subRows": []
          },
          {
            "header": {
              "label": "Children attending a governmental school",
              "groupedBy": [
                {
                  "property": "gender",
                  "value": {
                    "id": "X",
                    "label": "Non-binary/third gender"
                  }
                }
              ],
              "result": 19
            },
            "subRows": []
          },
          {
            "header": {
              "label": "Children attending a governmental school",
              "groupedBy": [
                {
                  "property": "gender",
                  "value": {
                    "id": "F",
                    "label": "female"
                  }
                }
              ],
              "result": 17
            },
            "subRows": []
          }
        ]
      },
      {
        "header": {
          "label": "Private schools",
          "groupedBy": [],
          "result": 4
        },
        "subRows": []
      },
      {
        "header": {
          "label": "Children attending a private school",
          "groupedBy": [],
          "result": 58
        },
        "subRows": [
          {
            "header": {
              "label": "Children attending a private school",
              "groupedBy": [
                {
                  "property": "gender",
                  "value": {
                    "id": "M",
                    "label": "male"
                  }
                }
              ],
              "result": 25
            },
            "subRows": []
          },
          {
            "header": {
              "label": "Children attending a private school",
              "groupedBy": [
                {
                  "property": "gender",
                  "value": {
                    "id": "X",
                    "label": "Non-binary/third gender"
                  }
                }
              ],
              "result": 16
            },
            "subRows": []
          },
          {
            "header": {
              "label": "Children attending a private school",
              "groupedBy": [
                {
                  "property": "gender",
                  "value": {
                    "id": "F",
                    "label": "female"
                  }
                }
              ],
              "result": 17
            },
            "subRows": []
          }
        ]
      }
    ]
  }
]`);

export const WithData = Template.bind({});
WithData.args = {
  rows: demoData,
};
