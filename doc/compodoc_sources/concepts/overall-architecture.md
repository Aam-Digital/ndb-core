# Overall Structure

This is a rough sketch of the architecture of the core system under discussion.
The modules and classes shown here are included in the ndb-core repository.
Note that some components and services are explicitly designed to be used and extended when developing feature modules,
while others will usually not need to be touched or understood when extending the system:
![](../../images/aam-modules.drawio.png)

## Folder Structure

The application code is split within the `src/app/` directory into modules providing
general features and abstract components (_core_) and
concrete feature modules for users' use cases (currently only _child-dev-project_).
