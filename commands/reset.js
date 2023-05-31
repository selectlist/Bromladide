const { SlashCommandBuilder } = require("discord.js");
const { reset } = require("../onboarding");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("reset")
		.setDescription("Reset a registered Onboarding session")
		.addUserOption((user) =>
			user
				.setName("user")
				.setDescription("Who's Onboarding session are you resetting?")
				.setRequired(true)
		)
		.setDMPermission(false),
	async execute(client, interaction, database) {
		await reset(client, interaction, database);
	},
	async autocomplete(interaction, database) {},
};
