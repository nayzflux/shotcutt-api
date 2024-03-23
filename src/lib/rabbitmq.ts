import amqp from "amqplib";

const connection = amqp.connect(process.env.RABBITMQ_URL!);

export default connection;
