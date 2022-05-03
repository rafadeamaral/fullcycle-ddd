# fullcycle-ddd

## Repositories
Ajustado o [OrderRepository](src/infrastructure/order/repository/sequilize/order.repository.ts) para implementar OrderRepositoryInterface.

## Domain Events
Ajustado o [customer.repository.spec](src/infrastructure/customer/repository/sequelize/customer.repository.spec.ts) para disparar eventos no teste "should create a customer and trigger event" (EnviaConsoleLog1Handler e EnviaConsoleLog2Handler) e "should update a customer and trigger event" (EnviaConsoleLogHandler).