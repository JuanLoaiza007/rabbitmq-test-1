import { connect } from "amqplib";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let delay = 10000;
let retries = 3;

async function connectWithRetry(url) {
  while (retries) {
    try {
      const connection = await connect(url);
      return connection;
    } catch (err) {
      console.error(`Error connecting to RabbitMQ: ${err}. Retrying...`);
      retries -= 1;
      await wait(delay);
    }
  }
  throw new Error("Failed to connect to RabbitMQ after several attempts");
}

(async () => {
  const connection = await connectWithRetry("amqp://user:password@rabbitmq");
  const channel = await connection.createChannel();
  const queue = "messages";

  await channel.assertQueue(queue, { durable: false });

  channel.consume(queue, async (msg) => {
    const messageContent = msg.content.toString();
    const verifiedMessage = `r1-${messageContent}`;
    console.log(`[x] Signed: ${verifiedMessage}`);

    const nextQueue = "receive2_queue";
    await channel.sendToQueue(nextQueue, Buffer.from(verifiedMessage));
  });
})();
