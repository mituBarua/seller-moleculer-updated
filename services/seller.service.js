
"use strict";

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 *
 */
const { MoleculerClientError } = require("moleculer").Errors;
const _ = require("lodash");
const jwt_decode = require('jwt-decode');

const Seller = require("../models/Seller.model");
const Schema = require("../mixins/db.mixin");
const jwt = require("jsonwebtoken");
const express = require("express");

module.exports = {
    name: "seller",
    mixins: [Schema()],
    model: Seller,

    settings: {},

    dependencies: [],
    actions: {
        create: {
            rest: {
                method: "POST",
                path: "/create",
            },

            async handler(ctx) {

                const sellerData = await Seller.create({
                    ...ctx.params,
                    created_by: ctx.meta.user.id
                });

                return {
                    success: true,
                    payload: sellerData,

                    message: "Added New Seller.",
                };
            }
        },
        update: {
            rest: {
                method: "PUT",
                path: "/:id",
            },
            auth: "required",
            async handler(ctx) {
                const sellerId = await this.checkSellerId(ctx.params.id);
                if (sellerId === null) {
                    returnPromise.reject(
                        new MoleculerClientError({
                            message: "This Seller is not Registered.",
                        })
                    );
                }

                const updateSellerInfo = await this.updateSeller(

                    ctx.params.id,
                    {
                        ...ctx.params
                    }
                );

                return {
                    success: true,
                    message: "seller updated succesfully...",
                };
            },
        },
        getSellerByIdInfo: {
            rest: {
                method: "GET",
                path: "/:id",
            },
            auth: "required",
            async handler(ctx) {

                const getSellerByIdInfo = await Seller.find({ created_by: ctx.params.id });
                return {
                    success: true,
                    payload: getSellerByIdInfo,


                }
            }
        },
        getAllSellerList: {
            rest: {
                method: "GET",
                path: "/sellers",
            },
            auth: "required",
            async handler(ctx) {

                const getAllSeller = await Seller.find({});
                return {
                    success: true,
                    payload: getAllSeller,


                }
            }
        },



    },
    events: {},

    methods: {

        async checkSellerId(id) {
            return await Seller.findOne({
                _id: id,
            });
        },
        async updateSeller(id, body) {
            return await Seller.updateOne({ _id: id }, { $set: body });
        },


    },
    created() {

    },

    async started() { },

    async stopped() { },
}