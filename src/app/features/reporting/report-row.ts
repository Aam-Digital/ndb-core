export interface ReportRow {
  header: { label: string; groupedBy: GroupByDescription[]; result: number };
  subRows: ReportRow[];
}

export interface GroupByDescription {
  property: string;
  value: any;
}

export function getGroupingInformationString(
  groupedBy: GroupByDescription[]
): string {
  if (groupedBy.length === 0) {
    return "";
  } else {
    return (
      "(" +
      groupedBy
        .map((group) => getValueDescription(group.value, group.property))
        .join(", ") +
      ")"
    );
  }
}

function getValueDescription(value: any, property: string): string {
  if (typeof value === "boolean") {
    return value
      ? property
      : $localize`:Not a certain property|e.g. 'not male':not ${property}`;
  } else if (!value) {
    return $localize`:Excluding a certain property|e.g. 'without religion':without ${property}`;
  } else if (value.hasOwnProperty("label")) {
    return value.label;
  } else {
    return value;
  }
}
