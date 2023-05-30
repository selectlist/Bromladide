// Packages
require("colors");

// Info
const info = (name, message) =>
	console.log(`${"[INFO]".red} [${name.green}] => ${message}`);

// Debug
const debug = (name, message) =>
	console.log(`${"[DEBUG]".green} [${name.green}] => ${message}`);

// Error
const error = (name, message) =>
	console.log(`${"[ERROR]".red} [${name.green}] => ${message}`);

// Success
const success = (name, message) =>
	console.log(`${"[SUCCESS]".green} [${name.green}] => ${message}`);

// Export
module.exports = {
	info,
	debug,
	error,
	success,
};
