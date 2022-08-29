"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;
let sellerSchema = new Schema(

    {
        currency: {
            type: String,
            trim: true,
            required: "Please fill in currency",
        },
        companyRegistrationNo: {
            type: String,
            trim: true,
            required: "Please fill in company registration no",
            unique: true,
        },
        vatNo: {
            type: String,
            trim: true,
            required: "Please fill in vatNo",
            unique: true,
        },
        address: {
            type: String,
            trim: true,
            required: "Please fill in address",
        },
        zipCode: {
            type: String,
            trim: true,
            required: "Please fill in zipCode",
        },
        city: {
            type: String,
            trim: true,
            required: "Please fill in city",
        },
        state: {
            type: String,
            trim: true,
            required: "Please fill in state",
        },
        secondaryPhone: {
            type: String,
            trim: true,

        },
        logo: {
            type: String,
            data: Buffer
        },
        banner: {
            type: String,
            data: Buffer
        },
        status: {
            type: String,
            default: 'pending',
            enum: ['pending', 'approved', 'rejected'],
        },
        sellerId:{
            type: String,
            trim: true,
        },
        created_by: {
            type: String,
            required: true
        }


    },
    {
        timestamps: true,
    }
);
// Add full-text search index
sellerSchema.index({
    //"$**": "text"
    title: "text",
    content: "text",
});

module.exports = mongoose.model("Seller", sellerSchema);