import { GuildMember } from 'discord.js';
import { CommandContext } from 'slash-create';
import ServiceUtils from '../../utils/ServiceUtils';

export default async (member: GuildMember, ctx: CommandContext): Promise<any> => {
	if (member.partial) {
		member = await member.fetch();
	}

	if (ServiceUtils.isALevel2Contributor(member)) {
		await ctx.send({ content: 'Thank you so much for your contributions! As a thank you we invite you to a Level 2 coordinape round: https://tally.so/r/3laLMB', ephemeral: true });
		return;
	}

	if (ServiceUtils.isJustAMember(member)) {
		await ctx.send({ content: 'Thank you so much for being a part of something special. As a thank you we invite you to a member coordinape round: https://tally.so/r/waO0zq', ephemeral: true });
		return;
	}

	if (ServiceUtils.isAGuest(member)) {
		await ctx.send({ content: 'Thank you so much for your interest in BanklessDAO. As a thank you we invite you to a guest coordinape round: https://tally.so/r/mBEZeN', ephemeral: true });
		return;
	}
};