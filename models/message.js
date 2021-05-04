const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    from: {
        type: String,
    },
    to: {
        type: String,
    },
    text: {
        type: String,
    },
}, { timestamps: true });

MessageSchema.methods.toJSON = function () {
	const msg = this;
	const msgObject = msg.toObject();

	delete msgObject._id;
    delete msgObject.updatedAt;

	return msgObject;
};

const Message = mongoose.model("messages", MessageSchema);

module.exports = Message;