import { SelectableFilter } from "./filters";
import { FilterService } from "../filter.service";

describe("Filters", () => {
  const filterService = new FilterService(undefined);
  it("create an instance", () => {
    const fs = new SelectableFilter(
      "",
      [{ key: "", label: "", filter: "" }],
      "",
    );
    expect(fs).toBeTruthy();
  });

  it("init new options", () => {
    const fs = new SelectableFilter(
      "",
      [{ key: "", label: "", filter: "" }],
      "",
    );

    const keys = ["x", "y"];
    fs.options = SelectableFilter.generateOptions(keys, "category");

    expect(fs.options).toHaveSize(keys.length + 1);

    const testData = [
      { id: 1, category: "x" },
      { id: 2, category: "y" },
    ] as any;
    fs.selectedOption = "x";
    const predicate = filterService.getFilterPredicate(fs.getFilter());
    const filteredData = testData.filter(predicate);

    expect(filteredData).toHaveSize(1);
    expect(filteredData[0].category).toBe("x");
  });
});
