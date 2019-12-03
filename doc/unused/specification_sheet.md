# specification sheet Aam-Digital
## product description
The project    *Aam-Digital   * deals with the design, development and maintenance of a platform-independent database interface for the centralized, digital administration of forms. The project serves primarily to support social workers in order to minimize the time required for administrative tasks and thus to be able to focus on actual social commitment. In the longer term, the project is conceived as the development of a framework with which non-governmental organisations (NGOs) can create their own modular database systems.
## objective
With the successful completion of the project, a central overview of all pupils and children supported by the project should be possible, which presents all relevant information to be captured by the employees in a structured way. The time employees spend editing, searching and managing forms should be reduced, if possible kept to a minimum.
## product application
The product is used in an untypical distributed system environment with limited network connectivity. Both the technical system landscape and the experience in handling software on the part of the users is to be rated as below average (from a technical point of view). This affects the requirements to be fulfilled (see 5.).
## functional requirements

The following subitems are to be defined as functional requirements to be fulfilled. Requirements marked in red are the minimum requirements for a minimally functional product (MVP):

- Complete collection of the given information for children, schools etc. after presentation of the forms and the ER diagram. The information to be entered is structured as follows:
- children:
   * project number
   * name
   * sex
   * age
   * date of birth
   * school class
   * medium
   * address
   * annotations
   * guardian
   * guardian role
   * school timing
   * working days
   * phone numbers
   * last home visit
   * preferred meeting time
   * test hindi
   * test bengali
   * test english
   * test math
- schools
   * school id
   * name
   * board
   * highest class
   * address
   * phone number/contact info
   * annotations
   * fees
- legal guardian
   * address
   * contact info
   * name
   * relationship to child
   * preferred meeting time
### primary requirements
- children
   * create new
   * edit
   * delete
- attendance recording
- Evaluate and display the recorded attendance times graphically and in tabular form.
- logging reports and notes chronological on each individual project child should be implemented.
- Structured representation of all entities and objects captured by the project.
- Recording and display of the relations of individual objects (e.g.: child->school).
- User and account management for administrators.
-  Identification of individual users through unique user names
## non-functional requirements
- Offline administration of database changes and synchronization with the live database with existing network connection via the "Live Synch Feature" of PouchDB.
- Implementation of angular material design.
- platform and browser independence.
   
