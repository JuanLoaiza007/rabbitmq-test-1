import { connect } from "amqplib";
import http from "http";

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
  const connection = await connectWithRetry("amqp://rabbitmq");
  const channel = await connection.createChannel();
  const queue = "messages";

  await channel.assertQueue(queue, { durable: false });

  const server = http.createServer((req, res) => {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Receive service is running");
    } else {
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end("Method Not Allowed");
    }
  });

  channel.consume(queue, async (msg) => {
    console.log(`[x] Received ${msg.content.toString()}`);
  });

  server.listen(3001, () => {
    console.log("Receive server is listening on port 3001");
  });
})();
