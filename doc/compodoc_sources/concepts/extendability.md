# Extendability and Plugin Approach

Aam Digital is designed to be an extendable platform.
We try to define core interfaces that can be implemented in additional feature modules
to implement further functionality in a modular way.

The following aspects are specifically designed to be extended:

- **DataTypes**
  - transformation functions how data is stored in / read from database
  - `editComponent` how data is displayed and edited in forms
  - `viewComponent` how data is displayed in tables
  - `importValueMapping` to support smart import into the data type
  - _also see [How to create a new Datatype](../how-to-guides/create-a-new-datatype.html)_
- **Entity Types**
  - pre-define a data structure with various fields and custom logic that may be interconnected. This mostly is useful if you implement very specialized UI components for a specific data structure.
  - any entity type can be extended through config for individual clients (e.g. adding further properties at runtime)
  - demo data generator to automatically provide useful sample records
  - _also see [How to create a new Entity Type](../how-to-guides/create-a-new-entity-type.html)_
- **Views**
  - defining a screen completely, including data loaded, etc. and hook it into the platforms navigation and overall layout
- **Sub-Views**
  - defining a screen to display custom details for the entity currently loaded in the active route. The core platform takes care of passing the current entity and config details to the view as inputs.
  - _also see [How to create an Entity Details Panel](../how-to-guides/create-an-entity-details-panel.html)_
- **Dashboard Widgets**
  - filling the given card template with custom data and visualization
- **Filters**
  - specialized logic and UIs to filter list data
- **Technical "Backend" Implementations**
  - less common to change, but possible to implement integrations with different technical systems are
    - Authentication Services (e.g. switch between native CouchDB users and more advance Keycloak)
    - Database / Local Storage (e.g. switch between PouchDB using IndexedDB and purely in-memory, discardable data storage - or possibly implement an integration with a different system)

The folder structure of the code base (while containing some intertwined legacy structures) also reflects this architecture:

- _src/app/core_: generic structures and platform code
- _src/app/features_: more specialized, modular features that plug into the core code (e.g. a location / map integration type)
