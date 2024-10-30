import { Component, Input, OnInit } from "@angular/core";
import { SqlReport } from "../../report-config";
import { JsonPipe, NgClass, NgForOf } from "@angular/common";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";

/**
 * represents a TableRow of a Report result data
 */
interface ReportRow {
  key: string;
  value: any[] | object | string | number;
  level: number;
}

@Component({
  selector: "app-sql-v2-table",
  standalone: true,
  imports: [MatTableModule, NgForOf, MatSortModule, NgClass, JsonPipe],
  templateUrl: "./sql-v2-table.component.html",
  styleUrl: "./sql-v2-table.component.scss",
})
export class SqlV2TableComponent implements OnInit {
  @Input() report: SqlReport;

  @Input() set reportData(value: any[]) {
    this.data = this.flattenData(value);
  }

  isError = false;

  dataSource = new MatTableDataSource();
  columns: string[] = ["Name", "Anzahl"]; // todo translate?

  data: ReportRow[] = [];

  ngOnInit(): void {
    this.dataSource.data = this.data;
  }

  /**
   * Handle ReportCalculation data and transform into ReportRow.
   *
   * example data:
   * [
   *   [
   *     {
   *       "Patenschaften neu verknüpft": 6
   *     }
   *   ],
   *   [
   *     {
   *       "Patenschaften Aktiv": 0
   *     }
   *   ],
   *   [
   *     {
   *       "Mentees neu aufgenommen": 2
   *     }
   *   ],
   *   {
   *     "Mentoren erreicht": [
   *       [
   *         {
   *           "junge Erwachsene 20 bis 29 Jahren": 4
   *         }
   *       ],
   *       [
   *         {
   *           "Erwachsene 30 bis 49 Jahren": 4
   *         }
   *       ]
   *     ]
   *   },
   *   [
   *     {
   *       "anzahl": 3,
   *       "status": "BEENDET",
   *       "foerderungDurch": null
   *     },
   *     {
   *       "anzahl": 1,
   *       "status": "MATCHING_LÄUFT",
   *       "foerderungDurch": null
   *     },
   *     {
   *       "anzahl": 1,
   *       "status": "MATCHING_LÄUFT",
   *       "foerderungDurch": "Menschen stärken Menschen"
   *     },
   *     {
   *       "anzahl": 1,
   *       "status": "PATENSCHAFT",
   *       "foerderungDurch": null
   *     }
   *   ]
   * ]
   *
   * @param data raw ReportCalculationData or sub-array
   * @param level each level will add some left-padding to visualize hierarchy
   */
  flattenData(
    data: any[],
    level = 0,
  ): { key: string; value: any; level: number }[] {
    this.isError = false;

    const result: { key: string; value: any; level: number }[] = [];

    try {
      data.forEach((item: any[] | object) => {
        if (Array.isArray(item)) {
          result.push(...this.flattenData(item, level));
        } else if (typeof item === "object") {
          let keys: string[] = Object.keys(item);

          if (keys.length === 1) {
            const key = keys[0];
            const value = item[key];
            if (Array.isArray(value)) {
              result.push({
                key,
                value: this.sumChildValues(value),
                level,
              });

              result.push(...this.flattenData(value, level + 1));
            } else {
              result.push({ key, value, level });
            }
          }

          if (keys.length > 1) {
            // assume a GROUP BY statement
            result.push(...this.mapGroupByRow(item, level));
          }
        }
      });
    } catch (error) {
      console.log(error);
      this.isError = true;
    }

    return result;
  }

  /**
   * sum of all number values of this item
   *
   * @param value any object array
   */
  private sumChildValues(value: any[]): number {
    return value
      .flatMap((it) => it)
      .flatMap((it) => Object.values(it))
      .filter((valueType) => typeof valueType === "number")
      .reduce((p, n) => p + n);
  }

  /**
   * map a multi value object to a ReportRow.
   * Attention: assumes, that the first key is the numeric value of this block.
   *
   * @param item object to transform
   * @param level current hierarchy level of this row
   * @private
   */
  private mapGroupByRow(item: object, level: number) {
    let keys = Object.keys(item);
    return [
      {
        key: keys
          .slice(1)
          .map((key) => key + ": " + (item[key] || "N/A"))
          .join(", "),
        value: Object.values(item)[0],
        level,
      },
    ];
  }
}
