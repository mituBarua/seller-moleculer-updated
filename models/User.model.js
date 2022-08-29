"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let userSchema = new Schema(
	{
		name: {
			type: String,
			trim: true,
			required: "Please fill in name",
		},
		email: {
			type: String,
			trim: true,
			required: "Please fill in email",
		},
		password: {
			type: String,
			trim: true,
		},
		mobile: {
			type: String,
			trim: true,
			required: "Please fill in mobile",
		},
		role: {
			type: String,
			default: 'user',
			enum: ['admin', 'user'],
		},
	},
	{
		timestamps: true,
	}
);

// Add full-text search index
userSchema.index({
	//"$**": "text"
	title: "text",
	content: "text",
});

module.exports = mongoose.model("User", userSchema);
