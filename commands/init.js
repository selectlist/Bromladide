const { SlashCommandBuilder } = require("discord.js");
const { init } = require("../onboarding");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("init")
		.setDescription("Create a server for your Onboarding Session.")
		.setDMPermission(false),
	async execute(client, interaction, database) {
		await init(client, interaction, database);
	},
	async autocomplete(interaction, database) {},
};
