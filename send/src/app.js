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
  const connection = await connectWithRetry("amqp://user:password@rabbitmq"); // En un proyecto real el usuario y contraseña no deberian exponerse aqui
  const channel = await connection.createChannel();
  const queue = "messages";

  await channel.assertQueue(queue, { durable: false }); // durable: disk persistence

  // Crear un servidor HTTP
  const server = http.createServer((req, res) => {
    if (req.method === "POST") {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString(); // Convertir Buffer a string
      });

      req.on("end", () => {
        channel.sendToQueue(queue, Buffer.from(body));
        console.log(`[x] Sent ${body}`);
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
