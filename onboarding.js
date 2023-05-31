// Packages
const crypto = require("node:crypto");
const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	PermissionsBitField,
} = require("discord.js");

// Channels
const channels = (Guild) => {
	return {
		onboard: Guild.channels.cache.find(
			(channel) => channel.name === "get-started"
		),
		readme: Guild.channels.cache.find(
			(channel) => channel.name === "readme"
		),
		notes: Guild.channels.cache.find((channel) => channel.name === "notes"),
	};
};

// Init
const init = async (client, interaction, database) => {
	const user = await database.User.getUser(interaction.user.id);

	if (user) {
		const sessions = user.onboarding;
		const session = sessions.filter(
			(onboard) => onboard.passed === null && onboard.server_id === null
		);

		if (session[0]) {
			const embed = new client.EmbedBuilder()
				.setTitle("Initialize Onboarding Session!")
				.setColor(0xff0000)
				.setDescription("Creating your Onboarding session!");

			interaction
				.reply({
					embeds: [embed],
				})
				.then(async () => {
					const Guild = await client.guilds.create({
						name: "Onboarding Session",
						channels: [
							{
								name: "readme",
							},
							{
								name: "get-started",
							},
							{
								name: "notes",
							},
						],
						roles: [
							{
								id: 1,
								name: session[0].position.replaceAll("_", " "),
								color: "#FF0000",
								hoist: true,
								permissions: [
									PermissionsBitField.Flags.Administrator,
								],
							},
							{
								id: 2,
								name: "Under Review",
								color: "#009bff",
								hoist: true,
								permissions: [],
							},
						],
					});

					channels(Guild)["readme"].send(
						`Hello, <@${
							user.user_id
						}>. Welcome to Select List onboarding, it looks like you are wanting to become a ${session[0].position
							.toLowerCase()
							.replaceAll(
								"_",
								" "
							)}. Let's see if you will meet our expectations, by going to <#${
							channels(Guild)["onboard"].id
						}> and entering \`/start\`!\n\nPlease note that all messages and interactions within this server, is stored and will be viewed by a Staff Manager while reviewing your onboarding session. Once the review is finished, the data will automatically be deleted. If you need help during your onboarding session, you may ask a Staff Manager for assistance; Please note that there is a limitation on what Staff Managers can assist you with during a session.\n\nWe wish you good luck!\n\n- Bromladide`
					);

					channels(Guild)["notes"].send(
						"In this channel, you can take notes to help you through this onboarding process."
					);

					channels(Guild)
						["readme"].createInvite({
							maxAge: 0,
							unique: true,
							reason: "Onboarding session started!",
							maxUses: 2,
						})
						.then(async (invite) => {
							for (const i = 0; i < sessions.length; i++) {
								if (sessions[i].uuid === session[0].uuid) {
									sessions[i].server_id = Guild.id;
									break;
								}
							}

							await database.User.updateUser(
								user.user_id,
								user.username,
								user.bio,
								user.avatar,
								user.roles,
								user.flags,
								user.badges,
								sessions
							);

							const newEmbed = new client.EmbedBuilder()
								.setTitle("Initialized Onboarding Session!")
								.setColor(0xff0000)
								.setDescription(
									"Your onboarding session is ready!\nClick the button down below to get started!"
								);

							const button = new ActionRowBuilder().addComponents(
								new ButtonBuilder()
									.setURL(invite.url)
									.setLabel("Start Session!")
									.setStyle(ButtonStyle.Link)
							);

							interaction.editReply({
								embeds: [newEmbed],
								components: [button],
							});
						});
				});
		} else {
			interaction.reply(
				"Sorry, it seems that you don't have any registered onboarding sessions to start."
			);
		}
	} else {
		interaction.reply(
			"Sorry, it seems that you don't have any registered onboarding sessions to start."
		);
	}
};

// Start
const start = async (client, interaction, database) => {
	const Guild = client.guilds.cache.find(
		(entry) => entry.id === interaction.guild.id
	);

	if (Guild) {
		// Found the guild in cache.
		if (Guild.name === "Onboarding Session") {
			// Guild name matches as needed for session.
			const user = await database.User.getUser(interaction.user.id);

			if (user) {
				// The user exists in the database, as needed for session.
				const sessions = user.onboarding;
				const session = sessions.filter(
					(onboard) =>
						onboard.passed === null &&
						onboard.server_id === Guild.id
				);

				const startSession = async () => {
					// Let's get the user started!
					interaction.channel
						.send({
							content: "Let's get you started!",
						})
						.then(() => {
							setTimeout(() => {
								// After 2 seconds, send a New Bot alert.
								interaction.channel
									.send({
										embeds: [
											new client.EmbedBuilder()
												.setTitle("New Bot!")
												.setColor("Random")
												.addFields(
													{
														name: "Username",
														value: "Reductio",
														inline: false,
													},
													{
														name: "Owner",
														value: "Mizchiev Dev (775855009421066262)",
														inline: false,
													},
													{
														name: "Review Note",
														value: "Please let me know if there are any issues. Tysm!!!",
														inline: false,
													}
												),
										],
									})
									.then(() => {
										setTimeout(() => {
											// After 3 seconds of the New Bot alert being sent, inform the user that there is a new bot to review; as well as provide instructions on how to claim.
											interaction.channel.send({
												content:
													"Woah! There seems to be a new bot available to review. Invite the bot, and use the `/claim` command to claim it! Once you claim the bot, you can offically start to review it.",
											});
										}, 3000);
									});
							}, 2000);
						});
				};

				if (session[0]) {
					// Session exists in database.
					if (sessions.length === 1) {
						// This is the users first onboarding session.
						await interaction.reply({
							content: `Hello, ${interaction.user.username}. Welcome to Select List Onboarding!\nThis seems to be your first onboarding session, let's show you how we review bots at Select List; Maybe we will give you a shot!`,
						});

						await startSession();
					} else {
						// This user has had more than one onboarding session.
						await interaction.reply({
							content: `Hello, ${interaction.user.username}. Welcome to Select List Onboarding!\nThis seems to be your \`${sessions.length}\` session, since you are already aware how we review bots at Select List. Let's just get you started with one of our best bots on our service. Remember to review **ALL** commands, unless if instructed otherwise by a Staff Manager.`,
						});

						await startSession();
					}
				}
			} else {
				// User does not have a Select List Account.
				return interaction.reply({
					content:
						"Sorry, you cannot start this onboarding session; as you do not have a Select List account. Please go to https://select-list.xyz/ and create an account.",
				});
			}
		} else {
			// Guild name does not match as needed for session.
			return interaction.reply({
				content:
					"Sorry, this server is not valid for onboarding; as the name does not contain a session identifier. Please ask a Staff Manager to reset your Onboarding Session, to resolve this issue.",
			});
		}
	} else {
		// Guild was not found in cache.
		return interaction.reply({
			content:
				"Sorry, this server was not found in cache. This issue has been reported, and sent to our developers.",
		});
	}
};

// Approve
const approve = async (client, interaction, database) => {
	const member = interaction.options.getMember("user");

	const staffMember = await database.User.getUser(interaction.user.id);

	if (staffMember) {
		if (
			staffMember.roles.includes("OWNER") ||
			staffMember.roles.includes("STAFF_MANAGER")
		) {
			const userData = await database.User.getUser(member.user.id);

			if (userData) {
				const sessions = userData.onboarding;
				const session = sessions.filter(
					(onboard) =>
						onboard.passed === null && onboard.server_id != null
				);

				if (session[0]) {
					for (const i = 0; i < sessions.length; i++) {
						if (sessions[i].uuid === session[0].uuid) {
							const guild = client.guilds.cache.find(
								(entry) => entry.id === sessions[i].server_id
							);
							if (guild) guild.delete();

							sessions[i].passed = true;
							break;
						}
					}

					await database.User.updateUser(
						userData.user_id,
						userData.username,
						userData.bio,
						userData.avatar,
						userData.roles,
						userData.flags,
						userData.badges,
						sessions
					).then(() => {
						const embed = new client.EmbedBuilder()
							.setTitle("Onboarding")
							.setDescription(
								`Hello there!\n<@${interaction.user.id}> has approved your onboarding session.`
							)
							.setColor(0x0000ff);

						member
							.send({
								embeds: [embed],
							})
							.then(() => {
								interaction.reply(
									"The Onboarding session has been approved!\nThe user has been notified via Direct Messages."
								);
							})
							.catch(() => {
								interaction.reply(
									"The Onboarding session has been approved!\nThe user could not be contacted. Reason: Not sharing a mutual server, or user has Direct Messages disabled."
								);
							});
					});
				} else {
					interaction.reply(
						"Sorry, that user doesn't have any active onboarding sessions."
					);
				}
			} else {
				interaction.reply(
					"Sorry, that user does not exist on our database."
				);
			}
		} else {
			interaction.reply(
				"You do not have enough permissions to use this command"
			);
		}
	} else {
		interaction.reply(
			"You do not have enough permissions to use this command"
		);
	}
};

// Deny
const deny = async (client, interaction, database) => {
	const member = interaction.options.getMember("user");

	const staffMember = await database.User.getUser(interaction.user.id);

	if (staffMember) {
		if (
			staffMember.roles.includes("OWNER") ||
			staffMember.roles.includes("STAFF_MANAGER")
		) {
			const userData = await database.User.getUser(member.user.id);

			if (userData) {
				const sessions = userData.onboarding;
				const session = sessions.filter(
					(onboard) =>
						onboard.passed === null && onboard.server_id != null
				);

				if (session[0]) {
					for (const i = 0; i < sessions.length; i++) {
						if (sessions[i].uuid === session[0].uuid) {
							const guild = client.guilds.cache.find(
								(entry) => entry.id === sessions[i].server_id
							);
							if (guild) guild.delete();

							sessions[i].passed = false;
							break;
						}
					}

					await database.User.updateUser(
						userData.user_id,
						userData.username,
						userData.bio,
						userData.avatar,
						userData.roles,
						userData.flags,
						userData.badges,
						sessions
					).then(() => {
						const embed = new client.EmbedBuilder()
							.setTitle("Onboarding")
							.setDescription(
								`Hello there!\n<@${interaction.user.id}> has denied your onboarding session.`
							)
							.setColor(0x0000ff);

						member
							.send({
								embeds: [embed],
							})
							.then(() => {
								interaction.reply(
									"The Onboarding session has been denied!\nThe user has been notified via Direct Messages."
								);
							})
							.catch(() => {
								interaction.reply(
									"The Onboarding session has been denied!\nThe user could not be contacted. Reason: Not sharing a mutual server, or user has Direct Messages disabled."
								);
							});
					});
				} else {
					interaction.reply(
						"Sorry, that user doesn't have any active onboarding sessions."
					);
				}
			} else {
				interaction.reply(
					"Sorry, that user does not exist on our database."
				);
			}
		} else {
			interaction.reply(
				"You do not have enough permissions to use this command"
			);
		}
	} else {
		interaction.reply(
			"You do not have enough permissions to use this command"
		);
	}
};

// Register
const register = async (client, interaction, database) => {
	const member = interaction.options.getMember("user");
	const position = interaction.options.getString("position");

	const staffMember = await database.User.getUser(interaction.user.id);

	if (staffMember) {
		if (
			staffMember.roles.includes("OWNER") ||
			staffMember.roles.includes("STAFF_MANAGER")
		) {
			const sessions = [];

			const session = {
				passed: null,
				server_id: null,
				position: position,
				messages: [],
				uuid: crypto.randomUUID(),
			};

			sessions.push(session);

			const userData = await database.User.getUser(member.user.id);

			if (userData) {
				userData.onboarding.forEach((entry) => sessions.push(entry));

				await database.User.updateUser(
					userData.user_id,
					userData.username,
					userData.bio,
					userData.avatar,
					userData.roles,
					userData.flags,
					userData.badges,
					sessions
				)
					.then(() => {
						const embed = new client.EmbedBuilder()
							.setTitle("Onboarding")
							.setDescription(
								`Hello there!\n<@${
									interaction.user.id
								}> has registered a onboarding session to see if you will be able to handle the "${position
									.toLowerCase()
									.replaceAll(
										"_",
										" "
									)}" position for Select List.\n To start this onboarding session, please go to the Staff Center and run \`/init\` and follow the instructions!`
							)
							.setColor(0x0000ff);

						member
							.send({
								embeds: [embed],
							})
							.then(() => {
								interaction.reply(
									"Onboarding session has been regisered!\nThe user has been notified via Direct Messages."
								);
							})
							.catch(() => {
								interaction.reply(
									"Onboarding session has been registered!\nThe user could not be contacted. Reason: Not sharing a mutual server, or user has Direct Messages disabled."
								);
							});
					})
					.catch((err) => {
						interaction.reply(
							`Onboarding session was not registered due to an error!\n${client.codeBlock(
								"javascript",
								err
							)}`
						);
					});
			} else {
				interaction.reply("Sorry, that user does not exist.");
			}
		} else {
			interaction.reply(
				"You do not have enough permissions to use this command"
			);
		}
	} else {
		interaction.reply(
			"You do not have enough permissions to use this command"
		);
	}
};

// Reset
const reset = async (client, interaction, database) => {
	const member = interaction.options.getMember("user");
	const staffMember = await database.User.getUser(interaction.user.id);

	if (staffMember) {
		if (
			staffMember.roles.includes("OWNER") ||
			staffMember.roles.includes("STAFF_MANAGER")
		) {
			const userData = await database.User.getUser(member.user.id);

			if (userData) {
				const sessions = userData.onboarding;
				const session = sessions.filter(
					(onboard) =>
						onboard.passed === null && onboard.server_id != null
				);

				if (session[0]) {
					for (const i = 0; i < sessions.length; i++) {
						if (sessions[i].uuid === session[0].uuid) {
							const guild = client.guilds.cache.find(
								(entry) => entry.id === sessions[i].server_id
							);
							if (guild) guild.delete();

							sessions[i].passed = null;
							sessions[i].server_id = null;
							sessions[i].messages = [];
							break;
						}
					}

					await database.User.updateUser(
						userData.user_id,
						userData.username,
						userData.bio,
						userData.avatar,
						userData.roles,
						userData.flags,
						userData.badges,
						sessions
					).then(() => {
						const embed = new client.EmbedBuilder()
							.setTitle("Onboarding")
							.setDescription(
								`Hello there!\n<@${interaction.user.id}> has reset your onboarding session. Please run \`/onboard init\` whenever you are ready to restart the onboarding session!`
							)
							.setColor(0x0000ff);

						member
							.send({
								embeds: [embed],
							})
							.then(() => {
								interaction.reply(
									"The requested Onboarding session has been reset!\nThe user has been notified via Direct Messages."
								);
							})
							.catch(() => {
								interaction.reply(
									"The requested Onboarding session has been reset!\nThe user could not be contacted. Reason: Not sharing a mutual server, or user has Direct Messages disabled."
								);
							});
					});
				} else {
					interaction.reply(
						"That user does not have a ongoing onboarding session at this time."
					);
				}
			} else {
				interaction.reply("Sorry, that user does not exist.");
			}
		} else {
			interaction.reply(
				"You do not have enough permissions to use this command"
			);
		}
	} else {
		interaction.reply(
			"You do not have enough permissions to use this command"
		);
	}
};

// Expose Functions
module.exports = {
	init,
	start,
	approve,
	deny,
	register,
	reset,
};
