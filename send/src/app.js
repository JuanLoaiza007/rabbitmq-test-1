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
  const connection = await connectWithRetry("amqp://user:password@rabbitmq");
  const channelMessages = await connection.createChannel();
  const channelNumbers = await connection.createChannel();

  const messageQueue = "messages";
  const numberQueue = "numbers";

  await channelMessages.assertQueue(messageQueue, { durable: false });
  await channelNumbers.assertQueue(numberQueue, { durable: false });

  const server = http.createServer((req, res) => {
    let body = "";

    if (req.method === "POST") {
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        const { type, content } = JSON.parse(body); // Suponemos que el cuerpo tiene tipo y contenido

        if (type === "message") {
          channelMessages.sendToQueue(messageQueue, Buffer.from(content));
          console.log(`[x] Sent message: ${content}`);
        } else if (type === "number") {
          channelNumbers.sendToQueue(numberQueue, Buffer.from(content));
          console.log(`[x] Sent number: ${content}`);
        }

        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Message sent to RabbitMQ");
      });
    } else {
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end("Method Not Allowed");
    }
  });

  server.listen(3000, () => {
    console.log("Server is listening on port 3000");
  });
})();
