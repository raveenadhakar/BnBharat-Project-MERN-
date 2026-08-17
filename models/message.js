const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    // A conversation is between a guest and the listing owner
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Index for fast conversation lookup
messageSchema.index({ listing: 1, sender: 1, receiver: 1 });

module.exports = mongoose.model("Message", messageSchema);
