/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  KAFKA vs RABBITMQ — When to use which
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  RABBITMQ (used for booking emails in this project):
 *  ────────────────────────────────────────────────────
 *  ✅ Task queues — send email, send SMS, trigger webhook
 *  ✅ Messages consumed ONCE and deleted
 *  ✅ Simple pub/sub and RPC patterns
 *  ✅ Low latency, great for small teams
 *  ❌ Not designed for message replay
 *  ❌ Limited horizontal scaling
 *
 *  KAFKA (used for analytics & event streaming):
 *  ──────────────────────────────────────────────
 *  ✅ Event log / audit trail (who viewed what listing, when)
 *  ✅ Messages RETAINED for days/weeks — can be replayed
 *  ✅ Massive throughput (millions of events/second)
 *  ✅ Multiple consumers can read the same message
 *  ✅ Real-time analytics pipeline
 *  ❌ More complex setup (Zookeeper / KRaft)
 *  ❌ Overkill for simple task queues
 *
 *  IN THIS PROJECT:
 *  ─────────────────
 *  RabbitMQ → booking confirmed → send email (fire & forget)
 *  Kafka    → user viewed listing → analytics dashboard (stream processing)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  TO RUN KAFKA LOCALLY (Docker):
 *  ────────────────────────────────
 *  docker run -d --name kafka \
 *    -p 9092:9092 \
 *    -e KAFKA_ENABLE_KRAFT=yes \
 *    -e KAFKA_CFG_NODE_ID=1 \
 *    -e KAFKA_CFG_PROCESS_ROLES=broker,controller \
 *    -e KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093 \
 *    -e KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
 *    -e KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@localhost:9093 \
 *    -e KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER \
 *    bitnami/kafka:latest
 *
 *  npm install kafkajs
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Uncomment below after: npm install kafkajs
/*
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "bnbharat-app",
    brokers:  [process.env.KAFKA_BROKER || "localhost:9092"]
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "analytics-group" });

// ── PRODUCER: Track listing views ────────────────────────────────────
module.exports.trackListingView = async ({ userId, listingId, listingTitle }) => {
    await producer.connect();

    await producer.send({
        topic:    "listing-views",
        messages: [{
            key:   listingId,
            value: JSON.stringify({
                userId,
                listingId,
                listingTitle,
                timestamp: new Date().toISOString()
            })
        }]
    });

    await producer.disconnect();
    console.log(`📊 View event published for listing: ${listingTitle}`);
};

// ── CONSUMER: Analytics worker ───────────────────────────────────────
// Run this separately as a microservice / worker
module.exports.startAnalyticsConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: "listing-views", fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const event = JSON.parse(message.value.toString());
            console.log(`📊 Analytics: User ${event.userId} viewed "${event.listingTitle}" at ${event.timestamp}`);

            // Here you would:
            // 1. Increment view counter in Redis
            // 2. Store to analytics DB (ClickHouse, BigQuery)
            // 3. Feed into recommendation engine
        }
    });
};
*/

// ── HOW TO USE IN show.ejs route (controllers/listings.js) ───────────────────
/*
const { trackListingView } = require("../utils/kafka.js");

// Inside showListing:
if (req.user) {
    trackListingView({
        userId:       req.user._id.toString(),
        listingId:    listing._id.toString(),
        listingTitle: listing.title
    }).catch(() => {}); // non-blocking
}
*/
