# How to display related entities
A common recurring requirement is to display a list of entities that are related to the current context.
For example displaying a table of all notes relating to the selected child in its detail view.
You shouldn't have to implement almost the same components again and again for this,
so we have a generic [EntitySubrecordComponent](../../components/EntitySubrecordComponent.html) for these use cases.

## Creating a basic "subrecord" component
To keep code organized and separated you should create a new component that uses EntitySubrecordComponent
rather than trying to put everything into a larger component that includes other information as well
(e.g. create a ChildNotesComponent instead of putting your configuration for the EntitySubrecordComponent into the ChildDetailsComponent).

Best use the Angular CLI to generate a new component in the relevant module:
```
ng generate component child-notes
```

The template remains very simple as you build on top of the generic EntitySubrecordComponent
and pass your values and configurations into it:
```
<app-entity-subrecord
    [records]="records"
    [newRecordFactory]="generateNewRecordFactory()"
    [columns]="columns">
</app-entity-subrecord>
```

You need to set these parameters in your component class of course.
`[records]` simply takes an array of entities to be displayed,
e.g. in a oversimplified example (usually you would do some filtering or use a query):
```
records: Note[];

constructor(private entityMapper: EntityMapperService) {
    this.records = await this.entityMapper.loadType<Note>(Note);
}
```

The `[newRecordFactory]` is used to create a new entity of the required entity type when the user clicks the "add" button.
This has to be a function that returns a new entity instance:
```
generateNewRecordFactory() {
    // define values locally because "this" is a different scope after passing a function as input to another component
    const childId = this.childId;
    
    return () => {
      const newNote = new Note(Date.now().toString());
      newNote.date = new Date();
      newNote.children = [childId];
    
      return newNote;
    };
}
```
This gives you the power to already pre-fill certain values in the new entity
like in this example linking the new note with the selected child automatically.
Unfortunately the implementation has to be a little clumsy: A method that itself returns a function again.

Finally, the `[columns]` configuration allows you a lot of flexibility over 
which properties of the entities are shown and how they are formatted and edited.
This takes an array of [ColumnDescription](../../classes/ColumnDescription.html)s:
```
columns: Array<ColumnDescription> = [
    new ColumnDescription('subject', 'Topic', ColumnDescriptionInputType.TEXT, null, undefined, 'xs'),
    new ColumnDescription('text', 'Notes', ColumnDescriptionInputType.TEXTAREA, null, undefined, 'md'),
    new ColumnDescription('date', 'Date', ColumnDescriptionInputType.DATE, null, (v: Date) => this.datePipe.transform(v, 'yyyy-MM-dd'), 'xs'),
];
```
Only the properties that you set here will be displayed to the user.
Use the parameters to configure transformations and form field types.

> To learn about the full range of column options check out the API Reference:
> - [ColumnDescription](../../classes/ColumnDescription.html)
> - [ColumnDescriptionInputType](../../miscellaneous/enumerations.html#ColumnDescriptionInputType)

## Showing details of one entity
The EntitySubrecordComponent allows the user to edit an entity inline in the table.
If you have more complex entities it can be more feasible to show the user a modal (overlay) component
with the details of a single entity when a row of the table is clicked.

You can enable this optional behaviour by additionally setting the `[detailsComponent]` input property
of `<app-entity-subrecord>` in your template.
This simply takes a Component class that will be used to display details of a single entity instance.

To be able to use it in your template, you have to assign the Component class to a class variable:
```
@Component({
  selector: 'app-notes',
  template: '<app-entity-subrecord [records]="records" [columns]="columns" ' +
            '[detailsComponent]="detailsComponent">' +
            '</app-entity-subrecord>',
})
export class ChildNotesComponent  {
  detailsComponent = { component: NoteDetailsComponent, config: { displayMode: 1 } };
```

The Component used as "detailsComponent" receives the entity to be display as `MAT_DIALOG_DATA` like this:
```
export class NoteDetailsComponent implements OnInit, OnInitDynamicComponent {
    private note: Note;
    displayMode: number;

    constructor(@Inject(MAT_DIALOG_DATA) data: any) {
        this.note = data.entity;
    }
    
    async onInitFromDynamicConfig(config: any) {
        this.displayMode = config.displayMode;
        this.init();
    }
```
As shown above the (optional) config object is received by implementing the {@link OnInitDynamicComponent} 
interface's `onInitFromDynamicConfig` method.
