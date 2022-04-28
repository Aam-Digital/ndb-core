import { FilterSelection } from "./filter-selection";

describe("FilterSelection", () => {
  it("create an instance", () => {
    const fs = new FilterSelection("", []);
    expect(fs).toBeTruthy();
  });

  it("init new options", () => {
    const fs = new FilterSelection("", []);

    const keys = ["x", "y"];
    fs.options = FilterSelection.generateOptions(keys, "category");

    expect(fs.options).toHaveSize(keys.length + 1);

    const testData = [
      { id: 1, category: "x" },
      { id: 2, category: "y" },
    ];
    const selectedCategory = "x";
    const filteredData = testData.filter(
      fs.getFilterFunction(selectedCategory)
    );

    expect(filteredData).toHaveSize(1);
    expect(filteredData[0].category).toBe(selectedCategory);
  });
});
