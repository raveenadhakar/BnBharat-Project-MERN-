const Message = require("../models/message.js");
const Listing = require("../models/listing.js");

// GET /chat/:listingId  → Open chat between guest and host
module.exports.openChat = async (req, res) => {
    const listing = await Listing.findById(req.params.listingId).populate("owner");
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    const isOwner  = req.user._id.equals(listing.owner._id);
    // Guest chats with owner; owner chats with everyone (for now show all messages)
    const otherId  = isOwner ? null : listing.owner._id;

    const query = isOwner
        ? { listing: listing._id }   // owner sees all messages on this listing
        : {
            listing: listing._id,
            $or: [
                { sender: req.user._id, receiver: listing.owner._id },
                { sender: listing.owner._id, receiver: req.user._id }
            ]
          };

    const messages = await Message.find(query)
        .populate("sender", "username profilePic")
        .sort({ createdAt: 1 });

    // Mark messages sent to current user as read
    await Message.updateMany(
        { listing: listing._id, receiver: req.user._id, isRead: false },
        { isRead: true }
    );

    res.render("chat/chat.ejs", {
        listing,
        messages,
        otherUser:  isOwner ? null : listing.owner,
        receiverId: otherId ? otherId.toString() : "",
        currentUser: req.user
    });
};

// GET /chat  → All conversations for current user
module.exports.myConversations = async (req, res) => {
    const userId = req.user._id;

    const conversations = await Message.aggregate([
        {
            $match: {
                $or: [{ sender: userId }, { receiver: userId }]
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $group: {
                _id: "$listing",
                lastMessage: { $first: "$message" },
                lastTime:    { $first: "$createdAt" },
                unreadCount: {
                    $sum: {
                        $cond: [
                            { $and: [
                                { $eq: ["$receiver", userId] },
                                { $eq: ["$isRead", false] }
                            ]},
                            1, 0
                        ]
                    }
                }
            }
        },
        {
            $lookup: {
                from: "listings",
                localField: "_id",
                foreignField: "_id",
                as: "listing"
            }
        },
        { $unwind: "$listing" },
        { $sort: { lastTime: -1 } }
    ]);

    res.render("chat/conversations.ejs", { conversations });
};

// GET /chat/unread-count  → JSON badge count
module.exports.unreadCount = async (req, res) => {
    const count = await Message.countDocuments({
        receiver: req.user._id,
        isRead: false
    });
    res.json({ count });
};
