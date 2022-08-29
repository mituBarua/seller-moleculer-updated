"use strict";

const ApiGateway = require("moleculer-web");
const { UnAuthorizedError } = ApiGateway.Errors;

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 * @typedef {import('http').IncomingMessage} IncomingRequest Incoming HTTP Request
 * @typedef {import('http').ServerResponse} ServerResponse HTTP Server Response
 */

module.exports = {
	name: "api",
	mixins: [ApiGateway],


	settings: {
		// Exposed port
		port: process.env.PORT || 4000,

		// Exposed IP
		ip: "0.0.0.0",


		use: [],
		// Global CORS settings for all routes
		cors: {
			// Configures the Access-Control-Allow-Origin CORS header.
			origin: "*",
			// Configures the Access-Control-Allow-Methods CORS header. 
			methods: ["GET", "OPTIONS", "POST", "PUT", "DELETE"],
			// Configures the Access-Control-Allow-Headers CORS header.
			allowedHeaders: ["Content-Type","X-Requested-With"],
			// Configures the Access-Control-Expose-Headers CORS header.
			exposedHeaders: [],
			// Configures the Access-Control-Allow-Credentials CORS header.
			credentials: true,
			// Configures the Access-Control-Max-Age CORS header.
			maxAge: 3600
		},
		routes: [
			{
				path: "/api",

				whitelist: ["**"],


				use: [],


				mergeParams: true,


				authentication: false,


				authorization: true,


				autoAliases: true,

				aliases: {},

				callingOptions: {},
				// Set CORS headers
				cors: true,
				bodyParsers: {
					json: {
						strict: false,
						limit: "1MB",
					},
					urlencoded: {
						extended: true,
						limit: "1MB",
					},
				},


				mappingPolicy: "all", // Available values: "all", "restrict"

				// Enable/disable logging
				logging: true,
			},
		],


		log4XXResponses: false,

		logRequestParams: null,

		logResponseData: null,


		assets: {
			folder: "public",

			// Options to `server-static` module
			options: {},
		},
	},



	methods: {
		// async authorize(ctx, route, req) {
		// 	console.log("authorize call")
		// 	let token;
		// 	if (req.headers.authorization) {
		// 		let type = req.headers.authorization.split(" ")[0];
		// 		if (type === "Token" || type === "Bearer") {
		// 			token = req.headers.authorization.split(" ")[1];
		// 			console.log("token if",token)
		// 		}
		// 	}
		// 	if (!token) {
		// 		return Promise.reject(new UnAuthorizedError(ERR_NO_TOKEN));
		// 	}
		// 	// Verify JWT token
		// 	return ctx.call("user.resolveToken", { token })
		// 		.then(user => {
		// 			console.log("user",user);
		// 			if (!user)
		// 				return Promise.reject(new UnAuthorizedError(ERR_INVALID_TOKEN));

		// 			ctx.meta.user = user;
		// 		});
		// },



		async authorize(ctx, route, req) {
			console.log("authorize call")
			let token;
			if (req.headers.authorization) {
				let type = req.headers.authorization.split(" ")[0];
				if (type === "Token" || type === "Bearer")
					token = req.headers.authorization.split(" ")[1];
				console.log('if block', token)
			}

			let user;
			if (token) {

				// Verify JWT token
				try {
					console.log('try block');
					return ctx.call("user.resolveToken", { token })
						.then(user => {

							if (!user) return Promise.reject(new UnAuthorizedError(ERR_INVALID_TOKEN));
							ctx.meta.user = user;
							ctx.meta.token = token;
							console.log("user form api", user)
						});
					// user = await ctx.call("user.resolveToken", { token });
					// console.log('user', user);
					// if (user) {
					// 	this.logger.info("Authenticated via JWT: ", user.name);
					// 	// Reduce user fields (it will be transferred to other nodes)
					// 	ctx.meta.user = _.pick(user, ["_id", "name", "email", "password"]);
					// 	ctx.meta.token = token;
					// 	console.log('ctx.meta.token', ctx.meta.token);
					// 	ctx.meta.userID = user._id;
					// }
				} catch (err) {
					// Ignored because we continue processing if user doesn't exists
				}
			}

			// if (req.$action.auth == "required" && !user)
			// 	throw new UnAuthorizedError();
		},
		// async authorize(ctx, route, req) {
		// 	let token;
		// 	if (req.headers.authorization) {
		// 		let type = req.headers.authorization.split(" ")[0];
		// 		if (type === "Token" || type === "Bearer")
		// 			token = req.headers.authorization.split(" ")[1];
		// 			console.log("token",token);
		// 	}

		// 	let user;
		// 	if (token) {
		// 		// Verify JWT token
		// 		try {
		// 			user = await ctx.call("user.resolveToken", { token });
		// 			console.log(user);
		// 			if (user) {
		// 				this.logger.info("Authenticated via JWT: ", user.username);
		// 				// Reduce user fields (it will be transferred to other nodes)
		// 				ctx.meta.user = _.pick(user, ["_id", "username", "email", "image"]);
		// 				ctx.meta.token = token;
		// 				ctx.meta.userID = user._id;
		// 			}
		// 		} catch (err) {
		// 			// Ignored because we continue processing if user doesn't exists
		// 		}
		// 	}
		// },

		handleErr(res) {
			// console.log("res", res);
			return (err) => {
				this.logger.error("Request error!", err);

				res.status(err.code || 500).send(err.message);
			};
		},


	},
};
