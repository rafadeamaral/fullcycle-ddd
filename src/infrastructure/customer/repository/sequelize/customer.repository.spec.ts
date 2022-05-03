import { Sequelize } from "sequelize-typescript";
import EventDispatcher from "../../../../domain/@shared/event/event-dispatcher";
import Customer from "../../../../domain/customer/entity/customer";
import CustomerCreatedEvent from "../../../../domain/customer/event/customer-created-event";
import EnviaConsoleLogHandler from "../../../../domain/customer/event/handler/envia-console-log.handler";
import EnviaConsoleLog1Handler from "../../../../domain/customer/event/handler/envia-console-log1.handler";
import EnviaConsoleLog2Handler from "../../../../domain/customer/event/handler/envia-console-log2.handler";
import Address from "../../../../domain/customer/value-object/address";
import CustomerModel from "./customer.model";
import CustomerRepository from "./customer.repository";

describe("Customer repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([CustomerModel]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a customer and trigger event", async () => {
    const eventDispatcher = new EventDispatcher();
    const eventHandler1 = new EnviaConsoleLog1Handler();
    const spyEventHandler1 = jest.spyOn(eventHandler1, "handle");
    const eventHandler2 = new EnviaConsoleLog2Handler();
    const spyEventHandler2 = jest.spyOn(eventHandler2, "handle");
    const eventName = "CustomerCreatedEvent";

    eventDispatcher.register(eventName, eventHandler1);
    eventDispatcher.register(eventName, eventHandler2);

    expect(
      eventDispatcher.getEventHandlers[eventName][0]
    ).toMatchObject(eventHandler1);
    expect(
      eventDispatcher.getEventHandlers[eventName][1]
    ).toMatchObject(eventHandler2);

    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.Address = address;

    const customerCreatedEvent = new CustomerCreatedEvent(customer);

    await customerRepository.create(customer);
    eventDispatcher.notify(customerCreatedEvent);

    const customerModel = await CustomerModel.findOne({ where: { id: "123" } });

    expect(customerModel.toJSON()).toStrictEqual({
      id: "123",
      name: customer.name,
      active: customer.isActive(),
      rewardPoints: customer.rewardPoints,
      street: address.street,
      number: address.number,
      zipcode: address.zip,
      city: address.city,
    });
    expect(spyEventHandler1).toHaveBeenCalled();
    expect(spyEventHandler2).toHaveBeenCalled();
  });

  it("should update a customer and trigger event", async () => {
    const eventDispatcher = new EventDispatcher();
    const eventHandler = new EnviaConsoleLogHandler();
    const spyEventHandler = jest.spyOn(eventHandler, "handle");
    const eventName = "CustomerCreatedEvent";

    eventDispatcher.register(eventName, eventHandler);

    expect(
      eventDispatcher.getEventHandlers[eventName][0]
    ).toMatchObject(eventHandler);

    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.Address = address;
    await customerRepository.create(customer);

    customer.changeName("Customer 2");
    const address2 = new Address("Street 2", 2, "Zipcode 2", "City 2")
    customer.changeAddress(address2);

    const customerCreatedEvent = new CustomerCreatedEvent(customer);
    eventDispatcher.notify(customerCreatedEvent);

    await customerRepository.update(customer);
    const customerModel = await CustomerModel.findOne({ where: { id: "123" } });

    expect(customerModel.toJSON()).toStrictEqual({
      id: "123",
      name: customer.name,
      active: customer.isActive(),
      rewardPoints: customer.rewardPoints,
      street: address2.street,
      number: address2.number,
      zipcode: address2.zip,
      city: address2.city,
    });
    expect(spyEventHandler).toHaveBeenCalled();
  });

  it("should find a customer", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.Address = address;
    await customerRepository.create(customer);

    const customerResult = await customerRepository.find(customer.id);

    expect(customer).toStrictEqual(customerResult);
  });

  it("should throw an error when customer is not found", async () => {
    const customerRepository = new CustomerRepository();

    expect(async () => {
      await customerRepository.find("456ABC");
    }).rejects.toThrow("Customer not found");
  });

  it("should find all customers", async () => {
    const customerRepository = new CustomerRepository();
    const customer1 = new Customer("123", "Customer 1");
    const address1 = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer1.Address = address1;
    customer1.addRewardPoints(10);
    customer1.activate();

    const customer2 = new Customer("456", "Customer 2");
    const address2 = new Address("Street 2", 2, "Zipcode 2", "City 2");
    customer2.Address = address2;
    customer2.addRewardPoints(20);

    await customerRepository.create(customer1);
    await customerRepository.create(customer2);

    const customers = await customerRepository.findAll();

    expect(customers).toHaveLength(2);
    expect(customers).toContainEqual(customer1);
    expect(customers).toContainEqual(customer2);
  });
});
