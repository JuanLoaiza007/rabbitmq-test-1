import { connect } from "amqplib";

const connection = await connect("amqp://localhost");

const channel = await connection.createChannel();

const queue = "messages";
const message = "Hello World!";

await channel.assertQueue(queue, { durable: false }); // durable: disk persistence

channel.sendToQueue(queue, Buffer.from(message));
