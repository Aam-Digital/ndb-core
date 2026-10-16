import {
  addDefaultNoteViews,
  defaultNoteListView,
} from "./add-default-note-views";

describe("addDefaultNoteViews", () => {
  function migrate(data: Record<string, any>) {
    return addDefaultNoteViews("", { _id: "Config:CONFIG_ENTITY", data }).data;
  }

  it("adds the default Notes list and details views if missing", () => {
    const data = migrate({});

    expect(data["view:note"]).toEqual(defaultNoteListView);
    expect(data["view:note/:id"].component).toBe("NoteDetails");
  });

  it("does not add the default Notes list if notes have a custom route", () => {
    const data = migrate({ "entity:Note": { route: "/notes" } });

    expect(data["view:note"]).toBeUndefined();
  });
});
