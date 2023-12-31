export default Object.freeze({
	APP_VERSION: process.env.npm_package_version,
	APP_NAME: 'MadHatter',

	DISCORD_BOT_USER_ID: process.env.DISCORD_BOT_APPLICATION_ID,
	DB_NAME_DEGEN: 'degen',
	DB_NAME_NEXTAUTH: 'nextauth',

	DB_COLLECTION_TIMECARDS: 'timecards',
	DB_COLLECTION_GUEST_USERS: 'guestUsers',

	DB_COLLECTION_POAP_SETTINGS: 'poapSettings',
	DB_COLLECTION_POAP_PARTICIPANTS: 'poapParticipants',
	DB_COLLECTION_POAP_UNCLAIMED_PARTICIPANTS: 'poapUnclaimedParticipants',
	DB_COLLECTION_POAP_TWITTER_SETTINGS: 'poapTwitterSettings',
	DB_COLLECTION_POAP_TWITTER_PARTICIPANTS: 'poapTwitterParticipants',

	DB_COLLECTION_NEXT_AUTH_SESSIONS: 'sessions',
	DB_COLLECTION_NEXT_AUTH_ACCOUNTS: 'accounts',

	DB_COLLECTION_SQUAD: 'squad',

	DB_COLLECTION_POAP_ADMINS: 'poapAdmins',
	DB_COLLECTION_ALLOWLIST: 'allowList',

	DB_COLLECTION_MEETING_NOTES: 'meetingNotes',

	MONGODB_URI_PARTIAL: `${process.env.MONGODB_PREFIX}://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASS}@${process.env.MONGODB_CLUSTER}/`,
	MONGODB_OPTIONS: '?retryWrites=true&w=majority',

	POAP_REQUIRED_PARTICIPATION_DURATION: Number(process.env.POAP_REQUIRED_PARTICIPATION_DURATION),
	POAP_MAX_DURATION_MINUTES: Number(process.env.POAP_MAX_EVENT_DURATION_MINUTES),

	PLATFORM_TYPE_DISCORD: 'DISCORD',
	PLATFORM_TYPE_TWITTER: 'TWITTER',

	BANNED_NAMES: [
		'admin',
		'support',
		'bankless',
		'banklessadmin',
		'bankless-admin',
		'banklesssupport',
		'bankless-support',
		'banklesstechsupport',
		'bankless-tech-support',
		'banklessdao',
		'bankless-dao',
		'banklessdaosupport',
		'bankless-daosupport',
		'banklessdao-support',
		'bankless-dao-support',
		'banklessdaotechsupport',
		'banklessdao-tech-support',
		'bankless-dao-tech-support',
		'infosec',
		'collabland',
		'collablandsupport',
		'collabland-support',
		'coordinape',
		'coordinapesupport',
		'coordinape-support',
		'daopunkssupport',
		'daopunks-support',
		'discord',
		'discordsupport',
		'discord-support',
		'discoursesupport',
		'discourse-support',
		'ens',
		'enssupport',
		'ens-support',
		'ledger',
		'ledgersupport',
		'ledger-support',
		'metamask',
		'metamasksupport',
		'metamask-support',
		'notionsupport',
		'notion-support',
		'opensea',
		'openseasupport',
		'opensea-support',
		'snapshotsupport',
		'snapshot-support',
		'substacksupport',
		'substack-support',
		'techsupport',
		'tech-support',
		'uniswap',
		'uniswapsupport',
		'uniswap-support',
	],

	GUILD_CHOICES: [
		{
			name: 'Analytics',
			value: 'analytics',
		},
		{
			name: 'AudioVisual',
			value: 'audioVisual',
		},
		{
			name: 'DAOlationships',
			value: 'daolationships',
		},
		{
			name: 'Design',
			value: 'design',
		},
		{
			name: 'Developers',
			value: 'developers',
		},
		{
			name: 'Education',
			value: 'education',
		},
		{
			name: 'Legal',
			value: 'legal',
		},
		{
			name: 'Marketing',
			value: 'marketing',
		},
		{
			name: 'Operations',
			value: 'operations',
		},
		{
			name: 'Project Management',
			value: 'projectmanagement',
		},
		{
			name: 'Translators',
			value: 'translators',
		},
		{
			name: 'Treasury',
			value: 'treasury',
		},
		{
			name: 'Writers',
			value: 'writers',
		}],
});