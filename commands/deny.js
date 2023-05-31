const { SlashCommandBuilder } = require("discord.js");
const { deny } = require("../onboarding");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("deny")
		.setDescription("Deny a Onboarding session.")
		.setDMPermission(false)
		.addUserOption((user) =>
			user
				.setName("user")
				.setDescription("Who's Onboarding session are you denying?")
				.setRequired(true)
		),
	async execute(client, interaction, database) {
		await deny(client, interaction, database);
	},
	async autocomplete(interaction, database) {},
};
