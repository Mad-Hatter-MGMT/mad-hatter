import { DiscordEvent } from '../../types/discord/DiscordEvent';
import { ComponentContext } from 'slash-create';
import Log, { LogUtils } from '../../utils/Log';
import componentInteractionSquadUp from './squad/ComponentInteractionSquadUp';

export interface ComponentMeta {
	feature: string,
	method:string,
	label:string,
	data?:string
}

export default class implements DiscordEvent {

	name = 'componentInteraction';
	once = false;

	formatComponentMetaData(componentContext: ComponentContext): ComponentMeta {

		const componentMeta = {} as ComponentMeta;
		try {
			[componentMeta.feature, componentMeta.method, componentMeta.label, componentMeta.data] = componentContext.customID.split(':');
		} catch (e) {
			// do nothing 
		}

		return componentMeta;

	}

	async execute(componentContext: ComponentContext): Promise<any> {

		if (componentContext.componentType === 2) {
			await componentContext.defer(true);
			Log.debug('component interaction metadata');
			const meta = this.formatComponentMetaData(componentContext);
			Log.debug(JSON.stringify(meta));

			switch(meta.feature) {
			case 'squadUp':
				await componentInteractionSquadUp(componentContext, meta).catch(e => LogUtils.logError('interaction failed: componentInteractionSquadUp', e));
				break;
			}
			
		}

	}
}