const apiKeys = Object.freeze({
	DISCORD_BOT_ID: process.env.DISCORD_BOT_APPLICATION_ID,
	sentryDSN: process.env.SENTRY_IO_DSN,
	lokiHost: process.env.LOKI_HOST,
	lokiUserName: process.env.LOKI_USERNAME,
	lokiPassword: process.env.LOKI_PASSWORD,
});

export default apiKeys;