const express = require("express");
const router  = express.Router();
const { isLoggedIn } = require("../middleware.js");
const wrapAsync = require("../utils/wrapAsync.js");
const chatController = require("../controllers/chat.js");

// All conversations
router.get("/", isLoggedIn, wrapAsync(chatController.myConversations));

// Unread count API
router.get("/unread-count", isLoggedIn, wrapAsync(chatController.unreadCount));

// Open chat for a listing
router.get("/:listingId", isLoggedIn, wrapAsync(chatController.openChat));

module.exports = router;
