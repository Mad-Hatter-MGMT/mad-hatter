import apiKeys from '../service/constants/apiKeys';
import { CommandContext } from 'slash-create';
import * as Sentry from '@sentry/node';
import pino from 'pino';
import type { LokiOptions } from 'pino-loki';

const transport = pino.transport({
	target: 'pino-loki',
	options: {
		batching: true,
		interval: 5,

		host: apiKeys.lokiHost,
		basicAuth: {
			username: apiKeys.lokiUserName,
			password: apiKeys.lokiPassword,
		},
	},
});

let logger;

try {
	logger = pino(transport);
	logger.info('Logger initialized!');
} catch (e) {
	// eslint-disable-next-line no-console
	console.log('Please setup Pino basicAuth.');
	// eslint-disable-next-line no-console
	console.log(e);
	throw new Error();
}

const Log = {

	info(statement: string | any, options?: Omit<LokiOptions, 'level'>): void {
		logger.info(statement, options);
		Sentry.addBreadcrumb({
			level: Sentry.Severity.Info,
			message: statement,
		});
	},

	warn(statement: string | any, options?: Omit<LokiOptions, 'level'>): void {
		if (process.env.NODE_ENV != 'production' || !logger.warn) {
			// eslint-disable-next-line no-console
			console.log(statement);
		} else {
			logger.warn(statement, options);
			Sentry.addBreadcrumb({
				level: Sentry.Severity.Warning,
				message: statement,
			});
		}
	},

	debug(statement: string | any, options?: Omit<LokiOptions, 'level'>): void {
		if (process.env.NODE_ENV != 'production' || !logger.debug) {
			// eslint-disable-next-line no-console
			console.debug(statement);
			logger.debug(statement, options);
		} else {
			logger.debug(statement, options);
		}
	},

	error(statement: string | any, options?: Omit<LokiOptions, 'level'>): void {
		if (process.env.NODE_ENV != 'production' || !logger.error) {
			// eslint-disable-next-line no-console
			console.error(statement);
			logger.error(statement, options);
			Sentry.addBreadcrumb({
				level: Sentry.Severity.Error,
				message: statement,
			});
		} else {
			logger.error(statement, options);
			Sentry.addBreadcrumb({
				level: Sentry.Severity.Error,
				message: statement,
			});
		}
	},

	fatal(statement: string | any, options?: Omit<LokiOptions, 'level'>): void {
		if (process.env.NODE_ENV != 'production' || !logger.fatal) {
			// eslint-disable-next-line no-console
			console.error(statement);
		} else {
			logger.fatal(statement, options);
			Sentry.addBreadcrumb({
				level: Sentry.Severity.Fatal,
				message: statement,
			});
		}
	},

	trace(statement: string | any, options?: Omit<LokiOptions, 'level'>): void {
		if (process.env.NODE_ENV != 'production' || !logger.trace) {
			// eslint-disable-next-line no-console
			console.log(statement);
		} else {
			logger.trace(statement, options);
		}
	},

	log(statement: string | any, options?: Omit<LokiOptions, 'level'>): void {
		if (process.env.NODE_ENV != 'production') {
			// eslint-disable-next-line no-console
			console.log(statement);
		}
		logger.info(statement, options);
		Sentry.addBreadcrumb({
			level: Sentry.Severity.Log,
			message: statement,
		});
	},

	flush(): void {
		logger.flush();
	},
};

export const LogUtils = {
	logCommandStart(ctx: CommandContext): void {
		Log.info(`/${ctx.commandName} ran ${ctx.user.username}#${ctx.user.discriminator}`,
		);
	},

	logCommandEnd(ctx: CommandContext): void {
		Log.info(`/${ctx.commandName} ended ${ctx.user.username}#${ctx.user.discriminator}`,
		);
	},

	logError(message: string, error: Error | any, guildId?: string): void {
		try {
			Sentry.captureException(error, {
				tags: {
					guildId: guildId,
				},
			});
			Log.error(message,
			);
		} catch (e) {
			Log.error(message);
		}
	},
};

export default Log;