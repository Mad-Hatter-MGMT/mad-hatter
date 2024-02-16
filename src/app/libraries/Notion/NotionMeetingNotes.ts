import {
	Collection,
	ObjectId
} from 'mongodb';

export default interface NotionMeetingNotes extends Collection {
	_id: ObjectId,
	guild: string,
	databaseId: string,
}