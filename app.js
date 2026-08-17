require("dotenv").config();
require("./config/passport.js");

const express    = require("express");
const app        = express();
const http       = require("http");
const { Server } = require("socket.io");
const mongoose   = require("mongoose");
const path       = require("path");
const methodOverride = require("method-override");
const ejsMate    = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session    = require("express-session");
const flash      = require("connect-flash");
const passport   = require("passport");
const LocalStrategy = require("passport-local");
const User       = require("./models/user.js");
const Message    = require("./models/message.js");

// ── Routes ──────────────────────────────────────────────────────────
const listingRouter  = require("./routes/listing.js");
const reviewRouter   = require("./routes/review.js");
const authRoutes     = require("./routes/auth.js");
const bookingRouter  = require("./routes/booking.js");
const chatRouter     = require("./routes/chat.js");

// ── RabbitMQ worker (non-blocking) ──────────────────────────────────
const { startEmailWorker } = require("./utils/rabbitmq.js");

// ── Create HTTP server + Socket.io ──────────────────────────────────
const server = http.createServer(app);
const io     = new Server(server);

// ── DB Connection ────────────────────────────────────────────────────
main()
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.error("❌ DB error:", err));

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/BnBharat");
}

// ── Express Config ───────────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.use("/fontawesome", express.static(__dirname + "/node_modules/@fortawesome/fontawesome-free"));

// ── Session ──────────────────────────────────────────────────────────
const sessionOptions = {
    secret: process.env.SECRET || "fallbacksecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxAge:  30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

// ── Passport ─────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

// ── Global Locals Middleware ─────────────────────────────────────────
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success     = req.flash("success");
    res.locals.error       = req.flash("error");
    next();
});

// ── Routes ────────────────────────────────────────────────────────────
app.use("/listings",               listingRouter);
app.use("/listings/:id/reviews",   reviewRouter);
app.use("/bookings",               bookingRouter);
app.use("/chat",                   chatRouter);
app.use("/",                       authRoutes);

// ── 404 & Error Handlers ─────────────────────────────────────────────
app.use((req, res, next) => {
    next(new ExpressError(404, "Page not Found!"));
});

app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { statusCode, message });
});

// ── Socket.io — Real-time Chat ────────────────────────────────────────
io.on("connection", (socket) => {
    // Join a listing-specific room
    socket.on("joinRoom", (room) => {
        socket.join(room);
    });

    // Handle incoming message
    socket.on("sendMessage", async (data) => {
        const { room, listingId, message, senderId, senderName, receiverId } = data;

        // Basic validation
        if (!message || !message.trim() || !listingId || !senderId) return;

        try {
            // Persist to DB only if we have a valid receiverId
            if (receiverId) {
                await Message.create({
                    listing:  listingId,
                    sender:   senderId,
                    receiver: receiverId,
                    message:  message.trim()
                });
            }

            // Broadcast to everyone else in the room
            socket.to(room).emit("newMessage", {
                message:    message.trim(),
                senderId,
                senderName,
                createdAt:  new Date()
            });
        } catch (err) {
            console.error("Socket message error:", err.message);
        }
    });

    socket.on("disconnect", () => {});
});

// ── Start RabbitMQ Email Worker (non-blocking) ───────────────────────
startEmailWorker().catch(() =>
    console.log("ℹ️  RabbitMQ not available — email notifications disabled (booking still works)")
);

// ── Start Server ─────────────────────────────────────────────────────
server.listen(9080, () => {
    console.log("🚀 Server running on port 9080");
});
