import { 
    EmbedBuilder,
    Message
} from 'discord.js';
import {
	Collection
} from 'mongodb';
import LaunchSquad, {
	handleInteractionClaim,
	handleInteractionConfirm
} from './LaunchSquad';

export interface SquadBase {
	squadId: string,
	squadEmbed: EmbedBuilder,
	squadMessage: Message,
	dbSquad: Collection<any>,
}

export interface SquadClaim extends SquadBase {
	userId: string,
	claim: boolean,
	record: any,
}

export interface SquadStatus extends SquadBase {
	buttonLabels: string[],
	setActive: boolean,
}

export {
	handleInteractionClaim,
	handleInteractionConfirm
}

export default LaunchSquad;