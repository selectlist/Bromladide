const { SlashCommandBuilder } = require("discord.js");
const { register } = require("../onboarding");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("register")
		.setDescription("Register a Onboarding session")
		.addUserOption((user) =>
			user
				.setName("user")
				.setDescription(
					"Who are you registering the Onboarding session for?"
				)
				.setRequired(true)
		)
		.addStringOption((position) =>
			position
				.setName("position")
				.setDescription("What is the requested staff position?")
				.setRequired(true)
				.addChoices({
					name: "Bot Reviewer",
					value: "BOT_REVIEWER",
				})
		)
		.setDMPermission(false),
	async execute(client, interaction, database) {
		await register(client, interaction, database);
	},
	async autocomplete(interaction, database) {},
};
