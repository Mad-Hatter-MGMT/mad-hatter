import { ComponentContext } from 'slash-create';
import { handleInteractionConfirm, handleInteractionClaim } from '../../../libraries/SquadUp';
import { ComponentMeta } from '../ComponentInteraction';


export default async (componentContext: ComponentContext, meta: ComponentMeta): Promise<any> => {

	switch(meta.method) {
	case 'xPostConfirm':
	case 'finalConfirm':
		await handleInteractionConfirm(componentContext, meta);
		break;
	case 'postSquad':
		await handleInteractionClaim(componentContext, meta);
		break;
	}
};