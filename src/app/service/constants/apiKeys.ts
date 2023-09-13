const apiKeys = Object.freeze({
	DISCORD_BOT_ID: process.env.DISCORD_BOT_APPLICATION_ID,
	sentryDSN: process.env.SENTRY_IO_DSN,
	logDNAToken: process.env.LOGDNA_TOKEN,
	logDNAAppName: process.env.LOGDNA_APP_NAME,
	logDNADefault: process.env.LOGDNA_DEFAULT_LEVEL,
	lokiUserName: process.env.LOKI_USERNAME,
	lokiPassword: process.env.LOKI_PASSWORD,
});

export default apiKeys;