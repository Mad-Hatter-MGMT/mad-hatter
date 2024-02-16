import {
	Collection,
	ObjectId
} from 'mongodb';
import Checkin from './Checkin';
import Checkout from './Checkout';
import Hours from './Hours';

export interface Timecard extends Collection {
	_id: ObjectId,
	startTime: string,
	endTime: string,
    description: string,
    duration: number,
	discordUserId: string,
	discordServerId: string,
	isActive: boolean,
}

export {
	Checkin,
	Checkout,
	Hours
};