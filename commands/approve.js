const { SlashCommandBuilder } = require("discord.js");
const { approve } = require("../onboarding");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("approve")
		.setDescription("Approve a Onboarding session.")
		.setDMPermission(false)
		.addUserOption((user) =>
			user
				.setName("user")
				.setDescription("Who's Onboarding session are you approving?")
				.setRequired(true)
		),
	async execute(client, interaction, database) {
		await approve(client, interaction, database);
	},
	async autocomplete(interaction, database) {},
};
