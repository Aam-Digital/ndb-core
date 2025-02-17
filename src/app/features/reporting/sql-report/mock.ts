import { of } from "rxjs";
import { ReportCalculation, ReportData } from "./sql-report.service";

const MOCK_REPORT_CALCULATION: ReportCalculation = {
  id: "ReportCalculation:b64ccfa6-f98c-43d7-8db5-5e5d4e7a6fd0",
  report: {
    id: "ReportConfig:beneficiaries",
  },
  status: "FINISHED_SUCCESS",
  startDate: "2025-02-13T12:21:21.659",
  endDate: "2025-02-13T12:21:21.786",
  args: {},
  outcome: undefined,
};
const MOCKED_DATA: ReportData = {
  id: "ReportCalculation:b64ccfa6-f98c-43d7-8db5-5e5d4e7a6fd0_data.json",
  report: {
    id: "ReportConfig:beneficiaries",
  },
  calculation: {
    id: "ReportCalculation:b64ccfa6-f98c-43d7-8db5-5e5d4e7a6fd0",
  },
  //dataHash: "md5-QCSgviZEowK/ZN04LqVGyQ==",
  data: [
    {
      child_name: "Swarnalata Kakkar",
      child_gender: "M",
      _id: null,
      name: null,
    },
    {
      child_name: "Chakravarti Guha",
      child_gender: "X",
      _id: null,
      name: null,
    },
    {
      child_name: "Ujjawal Iyengar",
      child_gender: "X",
      _id: null,
      name: null,
    },
  ],
  // [
  //     {
  //         "Enrollments": 3
  //     }
  // ],
  // [
  //     {
  //         "Children": 151
  //     }
  // ],
  // {
  //     "reached": [
  //         [
  //             {
  //                 "Children": 151
  //             }
  //         ],
  //         [
  //             {
  //                 "Children": 151
  //             }
  //         ]
  //     ]
  // }
  // ]
};

export const MOCK_HTTP = {
  get: (url: string) => {
    if (url.includes("/data")) {
      return of(MOCKED_DATA);
    } else if (url.includes("/report-calculation/report/")) {
      return of([MOCK_REPORT_CALCULATION]);
    } else {
      return of(MOCK_REPORT_CALCULATION);
    }
  },

  post: () => of({ id: "mock-id-1" }),
};
