import amqp from "amqplib";
let channel: amqp.Channel | null = null;

export const connectToRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL as string);
    channel = await connection.createChannel();
    await channel.assertQueue(process.env.PAYMENT_QUEUE!, { durable: true });
    console.log("🐰 Connected to RabbitMQ");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
export const getChannel = () => {
  return channel;
};
