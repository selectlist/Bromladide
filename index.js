// Packages
const {
	Client,
	GatewayIntentBits,
	ActivityType,
	codeBlock,
	EmbedBuilder,
	Events,
} = require("discord.js");
const crypto = require("crypto");
const fetch = require("node-fetch");
const fs = require("node:fs");
const logger = require("./logger");
const database = require("./database/handler");

// Environment Variables
require("dotenv").config();

// Create Discord Client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

// Discord Client Additions
client.EmbedBuilder = EmbedBuilder;
client.codeBlock = codeBlock;
client.fetch = fetch;

// Discord Ready Event
client.once(Events.ClientReady, async () => {
	client.user.setActivity("SL Onboarding", {
		type: ActivityType.Watching,
	});

	client.user.setStatus("idle");

	logger.success("Discord", "Connected!");
});

// Discord Debug Event
client.on(Events.Debug, (info) => logger.debug("Discord", info));

// Discord Error Event
client.on(Events.Error, (error) => logger.error("Discord", error));

// Commands
client.commands = new Map();
const commandFiles = fs
	.readdirSync("./commands")
	.filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

// Buttons
client.buttons = new Map();
const buttonFiles = fs
	.readdirSync("./buttons")
	.filter((file) => file.endsWith(".js"));

for (const file of buttonFiles) {
	const button = require(`./buttons/${file}`);
	client.buttons.set(button.data.name, button);
}

// Modals
client.modals = new Map();
const modalFiles = fs
	.readdirSync("./modals")
	.filter((file) => file.endsWith(".js"));

for (const file of modalFiles) {
	const modal = require(`./modals/${file}`);
	client.modals.set(modal.data.name, modal);
}

// Discord Message Create Event
client.on(Events.MessageCreate, async (message) => {
	let allUsers = await database.User.listAll();

	allUsers.forEach(async (user) => {
		let sessions = user.onboarding;

		let session = sessions.find(
			(session) => session.server_id === message.guild.id
		);
		if (!session) return;

		if (sessions.uuid === session.uuid) {
			sessions.messages.push({
				user: `${message.author.username}#${message.author.discriminator}`,
				bot: message.author.bot,
				message: message.content,
				time: message.createdAt,
			});

			await database.User.updateUser(
				user.user_id,
				user.username,
				user.bio,
				user.avatar,
				user.roles,
				user.flags,
				user.badges,
				sessions,
				user.notifications
			);
		}
	});
});

// Discord Interaction Event
client.on(Events.InteractionCreate, async (interaction) => {
	// Block banned users
	const bannedUsers = client.bannedUsers;
	if (bannedUsers.includes(interaction.user.id)) return;

	// Slash Command
	if (interaction.isChatInputCommand()) {
		const command = client.commands.get(interaction.commandName);

		if (!command)
			return interaction.reply(
				"It seems that the command you are looking for, does not exist at this time."
			);

		try {
			await command.execute(client, interaction, database);
		} catch (error) {
			logger.error(`Command (${interaction.commandName})`, error);

			interaction.reply(
				`I just had a massive amount of Brain Damage, hold up.\n\n${codeBlock(
					"js",
					error
				)}`
			);
		}
	}

	// Buttons
	if (interaction.isButton()) {
		const button = client.buttons.get(interaction.customId);

		if (interaction.customId.startsWith("claim")) {
			const bot_id = interaction.customId.replace("claim-", "");

			// Only allow staff members to use this command.
			const user = await database.User.getUser(interaction.user.id);

			if (!user)
				return interaction.reply(
					"You do not have enough permissions to use this button."
				); // User does not exist.

			if (
				user.roles.includes("OWNER") ||
				user.roles.includes("ADMINISTRATOR") ||
				user.roles.includes("STAFF_MANAGER") ||
				user.roles.includes("DEVELOPER") ||
				user.roles.includes("MODERATOR") ||
				user.roles.includes("BOT_REVIEWER")
			) {
				const bot = await database.Bots.getBot(bot_id);
				if (!bot)
					return interaction.reply(
						"Sorry, that bot cannot be claimed as it does not exist."
					);

				if (bot.state === "AWAITING_REVIEW") {
					let audit_logs = [];
					bot.audit_logs.forEach((log) => audit_logs.push(log));

					audit_logs.push({
						uuid: crypto.randomUUID(),
						action: "CLAIMED",
						reason: null,
						user: interaction.user.id,
					});

					await database.Bots.updateBot(
						bot.bot_id,
						bot.avatar,
						bot.username,
						bot.description,
						bot.long_description,
						"CLAIMED",
						bot.flags,
						bot.owner,
						bot.extra_owners,
						bot.library,
						bot.nsfw,
						bot.tags,
						bot.invite,
						audit_logs
					)
						.then(() => {
							new Panel_Logging(
								client,
								interaction,
								bot,
								0,
								"Reason cannot be supplied, for the Claim action!"
							).render();

							return interaction.reply(
								"This bot has been claimed!"
							);
						})
						.catch((err) => {
							return interaction.reply(
								`An error occured while trying to claim this bot.\n\`\`\`${err}\`\`\``
							);
						});
				} else
					return interaction.reply(
						"Sorry, this bot cannot be claimed as it is not in the queue."
					);
			} else
				return interaction.reply(
					"You do not have enough permissions to use this button."
				);
		}

		if (interaction.customId.startsWith("forceClaim")) {
			const bot_id = interaction.customId.replace("forceClaim-", "");

			// Only allow staff members to use this command.
			const user = await database.User.getUser(interaction.user.id);

			if (!user)
				return interaction.reply(
					"You do not have enough permissions to use this button."
				); // User does not exist.

			if (
				user.roles.includes("OWNER") ||
				user.roles.includes("ADMINISTRATOR") ||
				user.roles.includes("STAFF_MANAGER") ||
				user.roles.includes("DEVELOPER") ||
				user.roles.includes("MODERATOR") ||
				user.roles.includes("BOT_REVIEWER")
			) {
				const bot = await database.Bots.getBot(bot_id);
				if (!bot)
					return interaction.reply(
						"Sorry, that bot cannot be force claimed as it does not exist."
					);

				if (bot.state === "CLAIMED") {
					let audit_logs = [];
					bot.audit_logs.forEach((log) => audit_logs.push(log));

					audit_logs.push({
						uuid: crypto.randomUUID(),
						action: "CLAIMED",
						reason: null,
						user: interaction.user.id,
					});

					audit_logs.push({
						uuid: crypto.randomUUID(),
						action: "UNCLAIMED",
						reason: "FORCE CLAIMED",
						user: interaction.user.id,
					});

					await database.Bots.updateBot(
						bot.bot_id,
						bot.avatar,
						bot.username,
						bot.description,
						bot.long_description,
						"CLAIMED",
						bot.flags,
						bot.owner,
						bot.extra_owners,
						bot.library,
						bot.nsfw,
						bot.tags,
						bot.invite,
						audit_logs
					)
						.then(() => {
							new Panel_Logging(
								client,
								interaction,
								bot,
								0,
								"Force Claimed"
							).render();

							return interaction.reply(
								"This bot has been force claimed!"
							);
						})
						.catch((err) => {
							return interaction.reply(
								`An error occured while trying to claim this bot.\n\`\`\`${err}\`\`\``
							);
						});
				} else
					return interaction.reply(
						"Sorry, this bot cannot be claimed as it is not in the queue."
					);
			} else
				return interaction.reply(
					"You do not have enough permissions to use this button."
				);
		} else if (
			["⏮️", "◀️", "⏹️", "▶️", "⏭️"].includes(interaction.customId)
		)
			return;
		else {
			if (!button)
				return interaction.reply(
					"It seems that the button that you are trying to use, has not been created yet."
				);

			try {
				await button.execute(client, interaction, database);
			} catch (error) {
				logger.error(`Button (${interaction.customId})`, error);

				interaction.reply(
					`I just had a massive amount of Brain Damage, hold up.\n\n${codeBlock(
						"js",
						error
					)}`
				);
			}
		}
	}

	// Modals
	if (interaction.isModalSubmit()) {
		const modal = client.modals.get(interaction.customId);

		if (!modal)
			return interaction.reply(
				"It seems that the modal that you are trying to use, has not been created yet."
			);

		try {
			await modal.execute(client, interaction, database);
		} catch (error) {
			logger.error(`Modal (${interaction.customId})`, error);

			interaction.reply(
				`I just had a massive amount of Brain Damage, hold up.\n\n${codeBlock(
					"js",
					error
				)}`
			);
		}
	}

	// Autocomplete
	if (interaction.isAutocomplete()) {
		const command = interaction.client.commands.get(
			interaction.commandName
		);
		if (!command)
			return logger.error(
				`Autocomplete (${interaction.commandName})`,
				"Unknown Error"
			);

		try {
			await command.autocomplete(interaction, database);
		} catch (error) {
			return logger.error(
				`Autocomplete (${interaction.commandName})`,
				error
			);
		}
	}
});

// Login to Discord
client.login(process.env.TOKEN);
