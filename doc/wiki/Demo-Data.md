To add data to the database for demo and testing you can add to the [DemoData](https://github.com/NGO-DB/ndb-core/blob/master/src/app/database/demo-data.ts) class of the Database module.

Create a new static method that returns an Array of Entity objects and make sure to also call it from the `getAllDemoEntities()` method to have your data loaded automatically.

You can also get the data here to use it in your unit tests.