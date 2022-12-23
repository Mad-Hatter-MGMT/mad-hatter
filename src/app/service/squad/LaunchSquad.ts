import {
	DMChannel,
	GuildMember,
	MessageEmbed,
	TextChannel,
	User,
	Message,
	MessageActionRow,
	MessageButton,
	EmbedField,
} from 'discord.js';
import { CommandContext, ComponentContext } from 'slash-create';
import Log, { LogUtils } from '../../utils/Log';
import SquadUtils from '../../utils/SquadUtils';
import ValidationError from '../../errors/ValidationError';
import client from '../../app';
import channelIds from '../constants/channelIds';
import { Db, Collection } from 'mongodb';
import dbInstance from '../../utils/MongoDbUtils';
import constants from '../constants/constants';
import { randomUUID } from 'crypto';
import { ComponentMeta } from '../../events/slash-create/ComponentInteraction';

export default async (member: GuildMember, ctx?: CommandContext): Promise<void> => {
	ctx?.send({ content: `Hi, ${ctx.user.mention}! I sent you a DM with more information.`, ephemeral: true });

	await getTitle(member.user, ctx);
};

const getTitle = async (user: User, ctx?: CommandContext): Promise<void> => {
	Log.debug('squadUp invoked getTitle()');

	const dmChannel: DMChannel = await user.createDM();

	Log.debug('squadUp getTitle() - about to send DM to user');
	let getTitlePrompt: Message;
	try {
		getTitlePrompt = await dmChannel.send({ content: 'Let\'s assemble a Squad! What is the title of your project?' });

	} catch {
		ctx?.send({ content: `Hi, ${ctx.user.mention}! Please enable DMs and try again.`, ephemeral: true });

		Log.debug('squadUp failed to send DM - possibly disabled?');

		return;
	}

	const collector = dmChannel.createMessageCollector({ max: 1, time: (10000 * 60), dispose: true });

	collector.on('collect', async (msg) => {

		try {
			await SquadUtils.validateTitle(user, msg.content);

			await getDescription(user, msg.content);

			return;

		} catch (e) {
			if (e instanceof ValidationError) {

				Log.debug('squadUp title validation failed');

				await getTitle(user);
			}
			return;
		}
	});

	collector.on('end', async (_, reason) => {

		// if getTitlePrompt is not the last message, time out silently.
		if ((getTitlePrompt.id === dmChannel.lastMessageId) && (reason === 'time')) {
			Log.debug('squadUp getTitle message collector timed out');

			await dmChannel.send('The conversation timed out.');
		}

		if (!['time'].includes(reason)) {
			Log.debug(`Squad getTitle collector stopped for unknown reason: ${reason}`);
		}
	});
};

const getDescription = async (user: User, title: string): Promise<void> => {
	Log.debug('squadUp invoked getDescription()');

	const dmChannel: DMChannel = await user.createDM();

	Log.debug('squadUp getDescription() - about to send input prompt DM to user');

	const getDescriptionPrompt = await dmChannel.send({ content: 'A short description perhaps?' });

	const collector = dmChannel.createMessageCollector({ max: 1, time: (10000 * 60), dispose: true });

	collector.on('collect', async (msg) => {

		try {
			await SquadUtils.validateSummary(user, msg.content);

			Log.debug('squadUp summary valid');

			const squadEmbed = createEmbed(user, title, msg.content);

			Log.debug('squadUp getDescription() - about to send preview embed DM to user');

			await xPostConfirm(user, squadEmbed);

			return;

		} catch (e) {
			if (e instanceof ValidationError) {
				Log.debug('squadUp summary validation failed');

				await getDescription(user, title);
			}

			return;
		}
	});

	collector.on('end', async (_, reason) => {

		// if getTitlePrompt is not the last message, time out silently.
		if ((getDescriptionPrompt.id === dmChannel.lastMessageId) && (reason === 'time')) {
			Log.debug('squadUp getDescription() message collector timed out');

			await dmChannel.send('The conversation timed out.');

		}

		if (!['time'].includes(reason)) {
			Log.debug(`Squad getDescription collector stopped for unknown reason: ${reason}`);
		}
	});
};

export const handleInteractionConfirm = async (componentContext: ComponentContext, meta: ComponentMeta): Promise<void> => {
	const emoji = meta.label;
	const user = await client.users.fetch(componentContext.user.id);
	const dmChannel = await user.createDM();
	const msg = await dmChannel.messages.fetch(componentContext.message.id);
	const squadEmbed = msg.embeds[0];

	if (emoji === '📮') {
		Log.debug('squadUp handleInteractionConfirm 📮 selected');

		return getCrossPostChannels(user, squadEmbed, componentContext);

	} else if (emoji === '👍') {
		Log.debug('squadUp handleInteractionConfirm 👍 selected');

		return postSquad(user, squadEmbed, meta, componentContext);

	} else if (emoji === '🔃') {
		Log.debug('squadUp handleInteractionConfirm 🔃 selected');

		await componentContext.send({ content: 'Let\'s start over.' });

		return getTitle(user);

	} else if (emoji === '❌') {
		Log.debug('squadUp handleInteractionConfirm ❌ selected');

		await componentContext.send({ content: 'Command cancelled.' });

		return;
	}
};

const xPostConfirm = async (user: User, squadEmbed: MessageEmbed): Promise<void> => {
	Log.debug('squadUp invoked xPostConfirm()');

	const dmChannel: DMChannel = await user.createDM();

	Log.debug('squadUp xPostConfirm() - about to send confirmation prompt DM to user');

	const row = new MessageActionRow();

	for (const emoji of ['👍', '📮', '❌', '🔃']) {
		row.addComponents(
			new MessageButton()
				.setCustomId(`squadUp:xPostConfirm:${emoji}`)
				.setLabel(`${emoji}`)
				.setStyle('SUCCESS'),
		);
	}

	await dmChannel.send({ content: 'Would you like to cross post the Squad in other channels? \n' +
				'👍 - Post now, without cross posting\n' +
				'📮 - Select cross post channels\n' +
				'🔃 - Start over\n' +
				'❌ - Abort',
	components: [row],
	embeds: [squadEmbed],
	});
};

const finalConfirm = async (user: User, squadEmbed: MessageEmbed, xChannelList: string[]): Promise<void> => {
	Log.debug('squadUp invoked finalConfirm()');

	const dmChannel: DMChannel = await user.createDM();

	Log.debug('squadUp finalConfirm() - about to send confirmation prompt DM to user');

	await dmChannel.send({ content: 'the following channels were selected:\n' });

	if (xChannelList.length > 0) {
		Log.debug('squadUp list of cross post channels was provided by user');

		for (const chan of xChannelList) {
			await dmChannel.send({ content: `<#${chan}>\n` });
		}
	}

	const row = new MessageActionRow();

	for (const emoji of ['👍', '❌', '🔃']) {
		row.addComponents(
			new MessageButton()
				.setCustomId(`squadUp:finalConfirm:${emoji}:${xChannelList.toString()}`)
				.setLabel(`${emoji}`)
				.setStyle('SUCCESS'),
		);
	}

	await dmChannel.send({ content:
			'👍 - Good to go, post now.\n' +
			'🔃 - I want to change something - start over\n' +
			'❌ - Abort',
	components: [row],
	embeds: [squadEmbed],
	});
};

const postSquad = async (user: User, squadEmbed: MessageEmbed, meta: ComponentMeta, componentContext: ComponentContext): Promise<void> => {
	Log.debug('squadUp postSquad() invoked');

	const dmChannel: DMChannel = await user.createDM();

	const squadChannel = await client.channels.fetch(channelIds.SQUAD) as TextChannel;

	const squadId = randomUUID();

	const row = new MessageActionRow();

	for (const emoji of ['🙋', '❌']) {
		row.addComponents(
			new MessageButton()
				.setCustomId(`squadUp:postSquad:${emoji}:${squadId}`)
				.setLabel(`${emoji}`)
				.setStyle('SUCCESS'),
		);
	}

	let squadMsg: Message;
	try {
		squadMsg = await squadChannel.send({ embeds: [squadEmbed], components: [row] });
	} catch (e) {
		LogUtils.logError('squadUp postSquad() failed to post to squad channel', e);
		await componentContext.send(`Failed to post in <#${channelIds.SQUAD}>, please check channel permissions and try again.`).catch();
		return;
	}

	await dbCreateSquad(squadId, squadEmbed, user.id, squadMsg);

	let xChannelList: string[];
	if (meta.data) xChannelList = meta.data.split(',');
	else xChannelList = [];

	if (xChannelList.length > 0) {
		Log.debug('squadUp postSquad() cross posting');

		for (const chan of xChannelList) {

			try {
				const xPostChannel: TextChannel = await client.channels.fetch(chan) as TextChannel;

				await xPostChannel.send({ embeds: [squadEmbed] });

				await xPostChannel.send({ content: `To join the squad, raise your hand here: <${squadMsg.url}>\n` });

			} catch (e) {
				LogUtils.logError(`failed to cross post in channel ${chan}`, e);
				await dmChannel.send(`Failed to post in <#${chan}>, please check channel permissions and try again or cross post manually`).catch();
			}
		}
	}
	Log.debug('squadUp postSquad() about to send success message to user via DM');

	await componentContext.send(`All done! Your squadUp has been posted. Check it out in <#${channelIds.SQUAD}>`);

};

const dbCreateSquad = async (squadId: string, squadEmbed: MessageEmbed, userId: string, squadMsg: Message): Promise<void> => {
	Log.debug('squadUp dbCreateSquad() invoked');

	const updateDoc = {
		_id: squadId,
		guildId: squadMsg.guild.id,
		messageId: squadMsg.id,
		authorId: userId,
		title: squadEmbed.title,
		description: squadEmbed.description,
		claimedBy: {},
		created: squadEmbed.timestamp,
		active: true,
	};

	const db: Db = await dbInstance.connect(constants.DB_NAME_DEGEN);

	const dbSquad = db.collection(constants.DB_COLLECTION_SQUAD);

	await dbSquad.insertOne(updateDoc);
};

interface SquadBase {
	squadId: string,
	squadEmbed: MessageEmbed,
	squadMessage: Message,
	dbSquad: Collection<any>,
}

interface SquadClaim extends SquadBase{
	userId: string,
	claim: boolean,
	record: any,
}

interface SquadStatus extends SquadBase{
	buttonLabels: string[],
	setActive: boolean,
}

export const handleInteractionClaim = async (componentContext: ComponentContext, meta: ComponentMeta): Promise<void> => {

	const user = await client.users.fetch(componentContext.user.id);

	const squadChannel = await client.channels.fetch(channelIds.SQUAD) as TextChannel;

	const squadMessage = await squadChannel.messages.fetch(componentContext.message.id);

	const db: Db = await dbInstance.connect(constants.DB_NAME_DEGEN);

	const squadBase = {
		squadId: meta.data,
		squadMessage: squadMessage,
		squadEmbed: squadMessage.embeds[0],
		dbSquad: db.collection(constants.DB_COLLECTION_SQUAD),
	};

	const emoji = meta.label;

	Log.debug(`SquadUp handleInteractionClaim(), squadId: ${squadBase.squadId} \nfetching db record`);

	const record = await squadBase.dbSquad.findOne({ '_id': squadBase.squadId });

	let msgContent: string;

	if (emoji === '🙋') {
		Log.debug('squadUp handleInteractionClaim 🙋 selected');

		const squadClaim: SquadClaim = {
			...squadBase,
			userId: user.id,
			claim: (!record.claimedBy[user.id]),
			record: record,
		};

		squadClaim.claim ?
			msgContent = 'Your application was recorded. The organizer will get in touch with you when the project starts.' :
			msgContent = 'Application withdrawn';

		await interactionClaimSquad(squadClaim);

	} else if (emoji === '❌') {
		Log.debug('squadUp handleInteractionClaim ❌ selected');

		const squadStatus: SquadStatus = {
			...squadBase,
			buttonLabels: ['🔃'],
			setActive: false,
		};

		msgContent = 'Squad halted';

		await interactionSetActiveSquad(squadStatus);

	} else if (emoji === '🔃') {
		Log.debug('squadUp handleInteractionClaim 🔃 selected');

		const squadStatus: SquadStatus = {
			...squadBase,
			buttonLabels: ['🙋', '❌'],
			setActive: true,
		};

		msgContent = 'Squad restarted';

		await interactionSetActiveSquad(squadStatus);
	}

	componentContext.send({ content: msgContent });
};

const interactionClaimSquad = async (squadClaim: SquadClaim): Promise<void> => {
	Log.debug(`squadUp interactionClaimSquad() claim=${squadClaim.claim}`);

	const insertDoc = squadClaim.record.claimedBy;

	const matchesEl = (el) => {
		return el.value === `🙋 - <@${squadClaim.userId}>`;
	};

	let updateEmbed: MessageEmbed;
	let fields: EmbedField[];

	switch(squadClaim.claim) {
	case true:
		if (squadClaim.squadEmbed.fields.length <= 24) {
			Log.debug('squadUp interactionClaimSquad() updating embed');
		
			updateEmbed = squadClaim.squadEmbed.addField('\u200b', `🙋 - <@${squadClaim.userId}>`, false);
				
		} else {
			Log.error('squadUp handleInteractionClaim() failed to update embed: max fields exceeded');

			updateEmbed = squadClaim.squadEmbed;
		}

		insertDoc[squadClaim.userId] = Date.now();

		break;

	case false:
		fields = squadClaim.squadEmbed.fields;

		fields.splice(fields.findIndex(matchesEl), 1);

		updateEmbed = squadClaim.squadEmbed;

		updateEmbed.fields = fields;

		delete insertDoc[squadClaim.userId];

		break;
	}

	await squadClaim.dbSquad.updateOne({ _id: squadClaim.squadId }, { $set: { claimedBy: insertDoc } }, { upsert: true });

	await squadClaim.squadMessage.edit({ embeds:[updateEmbed] });
};

const interactionSetActiveSquad = async (squadStatus: SquadStatus) => {
	const row = new MessageActionRow();
	for (const emoji of squadStatus.buttonLabels) {
		row.addComponents(
			new MessageButton()
				.setCustomId(`squadUp:postSquad:${emoji}:${squadStatus.squadId}`)
				.setLabel(`${emoji}`)
				.setStyle('SUCCESS'),
		);
	}

	await squadStatus.squadMessage.edit({ embeds:[squadStatus.squadEmbed], components: [row] })
		.catch(e => LogUtils.logError('squadUp handleInteractionClaim() failed to edit SquadMessage', e));


	const filter = { _id: squadStatus.squadId };
	const update = { $set: { active: squadStatus.setActive } };
	const options = { upsert: true };
	await squadStatus.dbSquad.updateOne(filter, update, options)
		.catch(e => LogUtils.logError('squadUp handleInteractionClaim() failed to update db', e));
		
};

const createEmbed = (user: User, title: string, description: string): MessageEmbed => {
	Log.debug('squadUp createEmbed() invoked');

	return new MessageEmbed()
		.setAuthor(user.username, user.avatarURL())
		.setTitle(title)
		.setDescription(description)
		.setTimestamp();
};

const getCrossPostChannels = async (user: User, squadEmbed: MessageEmbed, componentContext: ComponentContext) => {
	Log.debug('squadUp getCrossPostChannels() invoked');

	const dmChannel: DMChannel = await user.createDM();

	Log.debug('squadUp getCrossPostChannels() about to send DM to user: xPost channel list input prompt');

	const channelListInputPrompt = await componentContext.send({ content: 'Please send me a list of comma separated channel Id\'s' });

	const collector = dmChannel.createMessageCollector({ max: 1, time: (20000 * 60), dispose: true });

	collector.on('collect', async (msg) => {
		Log.debug('squadUp getCrossPostChannels() Received user input, running input transformation');

		try {

			// Remove white spaces
			Log.debug('squadUp getCrossPostChannels() Remove white spaces');
			const noWhitespaces = msg.content.replace(/\s/g, '');

			Log.debug('squadUp getCrossPostChannels() Split string by delimiter');
			const rawArray = noWhitespaces.split(',');

			// Remove duplicates
			Log.debug('squadUp getCrossPostChannels() Removing duplicate entries');
			const unique = [...new Set(rawArray)];

			// Only include items that consists of 18 numeric characters
			Log.debug('squadUp getCrossPostChannels() Regex to match channel IDs');
			const xPostChannels = [];
			for (const chan of unique) {
				if (/^[0-9]{18}/.test(chan)) {
					xPostChannels.push(chan);
				}
			}

			Log.debug('squadUp getCrossPostChannels() Input transformation complete');
			await finalConfirm(user, squadEmbed, xPostChannels);

			return;

		} catch (e) {
			LogUtils.logError('squadUp getCrossPostChannels() input transformation failed', e);

			if (e instanceof ValidationError) {
				await getCrossPostChannels(user, squadEmbed, componentContext);
			}
			return;
		}
	});

	collector.on('end', async (_, reason) => {

		// if channelListInputPrompt is not the last message, time out silently.
		if (((channelListInputPrompt as unknown as Message).id === dmChannel.lastMessageId) && (reason === 'time')) {
			await dmChannel.send('The conversation timed out.');
		}

		if (!['time', 'limit'].includes(reason)) {
			Log.debug(`Squad getCrossPostChannels collector stopped for unknown reason: ${reason}`);
		}
	});
};

export const checkExpiration = async (): Promise<void> => {
	Log.debug('squadUp checkExpiration() invoked');

	const db: Db = await dbInstance.connect(constants.DB_NAME_DEGEN);

	const dbSquad = db.collection(constants.DB_COLLECTION_SQUAD);

	const timestampAggregate = await dbSquad.aggregate([
		{ '$match': {	active: true } },
	]).toArray();

	let squadChannel: TextChannel;
	try {
		squadChannel = await client.channels.fetch(channelIds.SQUAD) as TextChannel;
	} catch {
		Log.debug('squadUp checkExpiration() failed to fetch squad channel');
		return;
	}

	for (const squad of timestampAggregate) {

		if ((+new Date() - squad.created) >= 1000 * 60 * 60 * 24 * 7) {
			Log.debug('squadUp checkExpiration() found expired squad');

			const guilds = await client.guilds.fetch();

			for (const oAuth2Guild of guilds.values()) {
				const guild = await oAuth2Guild.fetch();

				if (guild.id === squad.guildId) {
					const members = await guild.members.fetch();

					for (const member of members.values()) {
						if (member.id === squad.authorId) {

							const dmChannel: DMChannel = await member.createDM();
							Log.debug('squadUp checkExpiration() sending completion DM to squad author');

							await dmChannel.send({ content: 'Squad has been completed. Time to get in touch with your team! ' +
										`<https://discord.com/channels/${squad.guildId}/${channelIds.SQUAD}/${squad.messageId}>` });

							try {
								const squadMsg = await squadChannel.messages.fetch(squad.messageId);

								await squadMsg.reactions.removeAll();
	
								await squadMsg.react('🔃');
	
								await dbSquad.updateOne({ _id: squad._id }, { $set: { active: false } }, { upsert: true });

							} catch (e) {
								Log.debug('squadUp checkExpiration() failed to update expired squad');
							}
						}
					}
				}
			}
		}
	}
};