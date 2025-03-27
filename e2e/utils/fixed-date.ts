export async function setFixedDate(page, fixedDate) {
  const fakeNow = new Date(fixedDate).valueOf(); // Convert the fixed date to a timestamp
  await page.addInitScript(`{
    Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(${fakeNow}); // Default to the fixed date
        } else {
          super(...args); // Handle explicitly provided dates
        }
      }
    }
    const __DateNowOffset = ${fakeNow} - Date.now(); // Offset for Date.now()
    const __DateNow = Date.now;
    Date.now = () => __DateNow() + __DateNowOffset; // Override Date.now()
  }`);
}
