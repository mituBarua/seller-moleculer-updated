
"use strict";

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 *
 */
const { MoleculerClientError } = require("moleculer").Errors;
const _ = require("lodash");

const bcrypt = require("bcryptjs");
const User = require("../models/User.model");
const Schema = require("../mixins/db.mixin");
const jwt = require("jsonwebtoken");
const express = require("express");
const jwt_decode = require('jwt-decode');
const JWT_SECRET = "A0&MZC1D67$@1E2QA3";
const nodemailer = require("nodemailer");
module.exports = {
	name: "user",
	mixins: [Schema()],
	model: User,

	settings: {},

	dependencies: [],

	actions: {
		create: {
			rest: {
				method: "POST",
				path: "/create",
			},
			
			async handler(ctx) {
				const email = ctx.params.email;
				const validateUser = await this.validUser(email);
				if (validateUser) {
					return Promise.reject(
						new MoleculerClientError("Email is exist!")
					);
				}
				const userRoles = ['admin', 'user'];

				// checking the user role because only user/admin/QA user role is allowed to be updated :-
				if (userRoles.includes(ctx.params.role) === false) {
					return Promise.reject(
						new MoleculerClientError("This User-role is not allowd to be Registered.")
					);

				}
				ctx.params.password = bcrypt.hashSync(ctx.params.password, 10);
				const userdata = await User.create({
					...ctx.params,
				});

				const jwtToken = await this.jwtToken(userdata);
				// const jwtToken = jwt.sign({ userdata }, 'JWT_SECRET', { expiresIn: '1h' });
				return {
					success: true,
					payload: userdata,
					token: jwtToken,
					message: "Added New User.",
				};
			},
		},
		login: {
			rest: {
				method: "POST",
				path: "/login",
			},
			async handler(ctx) {
				const { email, password } = ctx.params;
				const validateUser = await this.validUser(email);
				console.log("validateUser", validateUser)
				if (!validateUser) {
					return Promise.reject(
						new MoleculerClientError("Email is not exist!")
					);
				}
				const res = await bcrypt.compare(password, validateUser.password);
				if (!res) {
					return Promise.reject(
						new MoleculerClientError("Password is not correct!")
					);
				}
				// if (validateUser.role !== 'admin') {
				// 	return res.status(404).send({ message: 'Only Admin can access this Page.' });
				// }

				const jwtToken = await this.jwtToken(validateUser);
			
				return {
					success: true,
					payload: {

						email: validateUser.email,
						role: validateUser.role
					},
					token: jwtToken,
					message: "Login Successfully",
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
				const notUpdateUser = await this.checkUserId(ctx.params.id);
				if (notUpdateUser === null) {
					returnPromise.reject(
						new MoleculerClientError({
							message: "This User/QA/Admin is not Registered.",
						})
					);
				}
				const updateUserDetails = await this.updateUser(
					ctx.params.id,
					{ ...ctx.params }
				);

				return {
					success: true,
					message: "user updated succesfully...",
				};
			},
		},

		resolveToken: {
			cache: {
				keys: ["token"],
				ttl: 60 * 60 // 1 hour
			},
			params: {
				token: "string"
			},
			async handler(ctx) {

				const decoded = await new this.Promise((resolve, reject) => {
					console.log('resolve call');
					jwt.verify(ctx.params.token, JWT_SECRET, (err, decoded) => {
						if (err)
							return reject(err);

						resolve(decoded);

					});
				});

				if (decoded.id)
					return this.getById(decoded.id);
			}
		},
		list: {
			rest: {
				method: "GET",
				path: "/users",
			},
			auth: "required",
			async handler(ctx) {

				const getAllUser = await User.find({});
				return {
					success: true,
					payload: getAllUser,


				}
			}
		},

		forgotPassword: {
			rest: {
				method: "POST",
				path: "/forgotPassword",
			},
			async handler(ctx) {
				try {
					const email = ctx.params.email;
					const validateUser = await this.validUser(email);

					if (!validateUser) {
						return Promise.reject(
							new MoleculerClientError("Email is not exist!")
						);
					}
					const secretToken = JWT_SECRET + validateUser.password;

					const payload = {
						email: validateUser.email,
						id: validateUser.id
					}
					const token = jwt.sign({ user: payload }, secretToken, { expiresIn: '15m' });

					// const token = await this.jwtToken(payload, secretToken, { expiresIn: '15m' });
					const link = `http://localhost:4000/api/user/resetPassword/${validateUser.id}/${token}`;

					const emailLink = await this.sendEmail(link, email);
					return {
						success: true,
						link: link,
						message: " Password reset link has been sent to email"
					}

				}
				catch (error) {
					console.log(error);
				}
			}



		},

		resetPassword: {
			rest: {
				method: "GET",
				path: "/resetPassword/:id/:token"
			},
			async handler(ctx) {
				const { id, token } = ctx.params;
				const validateUserId = await this.checkUserId(id);

				if (id !== validateUserId.id) return Promise.reject(
					new MoleculerClientError("Invalid Id")
				);
				const secret = JWT_SECRET + validateUserId.password;

				try {
					const payload = jwt.verify(token, secret);
					return {
						data: {
							success: true,
							email: validateUserId.email,
							id: validateUserId.id,
							message: "reset-password"
						}
					}

				} catch (error) {
					console.log(error);
				}

			}
		},
		resetPassword: {
			rest: {
				method: "POST",
				path: "/resetPassword/:id/:token",
			},
			async handler(ctx) {
				try {
					const { id, token } = ctx.params;
					const emailDecode = await this.authDecode(token);

					const validateUserId = await this.checkUserId(id);

					if (id !== validateUserId.id) return Promise.reject(
						new MoleculerClientError("Invalid Id")
					);
					const secret = JWT_SECRET + validateUserId.password;

					try {
						const payload = jwt.verify(token, secret);
						const { newPassword, confirmNewPassword } = ctx.params;
						const validateUser = await this.validUser(emailDecode);
						if (!validateUser) return Promise.reject(
							new MoleculerClientError("Email is not exist!")
						);
						if (newPassword !== confirmNewPassword) {
							return Promise.reject(
								new MoleculerClientError("Password and Confirm New Password doesn't match.!")
							);
						}
						if (newPassword === confirmNewPassword) {
							const bcryptPassword = await bcrypt.hashSync(newPassword, 10);
							const updatedPassword = {
								password: bcryptPassword,
							};

							const changedPassword = await this.updateNewPassword(emailDecode, updatedPassword);
							return { success: true, message: 'New Password has been successfully Updated for this user.' };
						}

					} catch (error) {
						console.log(error);
					}



				} catch (e) {
					console.log(e);
				}
			}
		},
		//update role by user id done by Admin
		updateRole: {
			rest: {
				method: "PUT",
				path: "/updateRole/:id",
			},
			async handler(ctx) {

				const notUpdateUser = await this.checkUserId(ctx.params.id);
				if (notUpdateUser === null) {
					returnPromise.reject(
						new MoleculerClientError({
							message: "This User/QA/Admin is not Registered.",
						})
					);
				}
				const updateRole = await this.updateUser(
					ctx.params.id,
					{ ...ctx.params }
				);
				return {
					success: true,
					payload: updateRole,

					message: "Update Role.",
				};
			},
		}
	},
	events: {},

	methods: {

		handleErr(res) {
			console.log("res", res);
			throw res;

		},
		async updateUser(id, body) {
			return await User.updateOne({ _id: id }, { $set: body });
		},

		async checkUserId(id) {
			return await User.findOne({
				_id: id,
			});
		},
		async validUser(email) {
			return await User.findOne({
				email,
			});
		},
		jwtToken(user, res) {
			const token = jwt.sign(
				{
					id: user.id,
					name: user.name,
					email: user.email,
					password: user.password,
				},
				JWT_SECRET,
				{
					expiresIn: "1d",
				}
			);
			return token;
		},
		async updateNewPassword(email, body) {
			return await User.updateOne({ email }, { $set: body });
		},
		async sendEmail(link, email) {
			try {
				const transporter = await nodemailer.createTransport({
					host: "smtp.mailtrap.io",
					service: process.env.SERVICE,
					port: 587,

					auth: {
						user: "bc69233e2827a0",
						pass: "9c8ec41ab5e8b9"
					},
				});

				await transporter.sendMail({
					from: "name",
					to: email,
					subject: "reset password token",
					text: `Hi ,
					You requested to reset your password.Please, click the link below to reset your password
						${link}`
				});

				console.log("email sent sucessfully");
			} catch (error) {
				console.log(error, "email not sent");
			}
		},

		async authDecode(token) {

			try {
				// returning role & email :-
				const email = jwt_decode(token);

				return email.user.email
			} catch (e) {
				// returning error message :-
				return e.message;
			}
		}

	},

	created() {

	},

	async started() { },

	async stopped() { },
};
