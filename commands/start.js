const { SlashCommandBuilder } = require("discord.js");
const { start } = require("../onboarding");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("start")
		.setDescription("Start your Onboarding Session.")
		.setDMPermission(false),
	async execute(client, interaction, database) {
		await start(client, interaction, database);
	},
	async autocomplete(interaction, database) {},
};
