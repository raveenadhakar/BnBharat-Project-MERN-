/**
 * RabbitMQ Utility - Async message queue for booking notifications
 *
 * WHY RabbitMQ (vs Kafka)?
 * ─────────────────────────────────────────────────────────────────
 * RabbitMQ  → Task queues, transient messages, RPC patterns
 *             Best for: send email, send SMS, process payment webhook
 *             Messages are consumed ONCE and deleted
 *
 * Apache Kafka → Event streaming, audit logs, real-time analytics
 *                Best for: user activity stream, analytics pipeline
 *                Messages are retained and can be replayed
 *
 * For booking confirmation emails → RabbitMQ is the right choice
 * For "user viewed listing X" analytics → Kafka is the right choice
 * ─────────────────────────────────────────────────────────────────
 */

const amqplib = require("amqplib");
const nodemailer = require("nodemailer");

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const QUEUE_NAME   = "booking_confirmations";

// ──────────────────────────────────────────────
// PRODUCER: Called after payment is verified
// ──────────────────────────────────────────────
module.exports.publishBookingConfirmation = async (bookingData) => {
    let connection;
    try {
        connection = await amqplib.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        // durable: true → queue survives RabbitMQ restart
        await channel.assertQueue(QUEUE_NAME, { durable: true });

        // persistent: 2 → message survives broker restart
        channel.sendToQueue(
            QUEUE_NAME,
            Buffer.from(JSON.stringify(bookingData)),
            { persistent: true }
        );

        console.log(`📨 Booking confirmation queued for ${bookingData.guestEmail}`);
        await channel.close();
    } catch (err) {
        console.error("RabbitMQ publish error:", err.message);
        // Non-blocking: booking is confirmed even if email fails
    } finally {
        if (connection) await connection.close();
    }
};

// ──────────────────────────────────────────────
// CONSUMER: Runs as a background worker
// Call startEmailWorker() once in app.js
// ──────────────────────────────────────────────
module.exports.startEmailWorker = async () => {
    try {
        const connection = await amqplib.connect(RABBITMQ_URL);
        const channel    = await connection.createChannel();

        await channel.assertQueue(QUEUE_NAME, { durable: true });

        // Process one message at a time
        channel.prefetch(1);

        console.log("📬 Email worker listening on queue:", QUEUE_NAME);

        channel.consume(QUEUE_NAME, async (msg) => {
            if (!msg) return;

            const data = JSON.parse(msg.content.toString());

            try {
                await sendConfirmationEmail(data);
                // ACK → message removed from queue
                channel.ack(msg);
                console.log(`✅ Confirmation email sent to ${data.guestEmail}`);
            } catch (err) {
                console.error("Email send failed:", err.message);
                // NACK → requeue the message to retry
                channel.nack(msg, false, true);
            }
        });
    } catch (err) {
        // Rethrow so app.js handles the log message — no double logging
        throw new Error("RabbitMQ unavailable");
    }
};

// ──────────────────────────────────────────────
// Email sender using Nodemailer
// ──────────────────────────────────────────────
async function sendConfirmationEmail(data) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS  // Use App Password for Gmail
        }
    });

    const mailOptions = {
        from: `"BnBharat" <${process.env.EMAIL_USER}>`,
        to: data.guestEmail,
        subject: `Booking Confirmed - ${data.listingTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #fe424d; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🏠 BnBharat</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #333;">Booking Confirmed! 🎉</h2>
                    <p>Hi <strong>${data.guestName}</strong>,</p>
                    <p>Your booking has been confirmed. Here are the details:</p>
                    
                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #fe424d;">
                        <h3 style="margin: 0 0 15px 0; color: #fe424d;">${data.listingTitle}</h3>
                        <p><strong>📅 Check-in:</strong> ${data.checkIn}</p>
                        <p><strong>📅 Check-out:</strong> ${data.checkOut}</p>
                        <p><strong>💰 Total Amount:</strong> ₹${data.totalAmount.toLocaleString("en-IN")}</p>
                        <p><strong>🔖 Booking ID:</strong> ${data.bookingId}</p>
                    </div>
                    
                    <p style="color: #666;">Have a wonderful stay!</p>
                    <p style="color: #666;">— The BnBharat Team</p>
                </div>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}
