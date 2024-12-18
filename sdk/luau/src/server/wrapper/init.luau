local wrapper = {}

local constants = require("@src/constants")
local sendRequest = require("./sendRequest")

local wrapperData: WrapperData = {} :: WrapperData

local function formatUsers(users: { Player }): { FormattedPlayer }
	local formatted = {}

	for _, player in users do
		table.insert(formatted, {
			id = tostring(player.UserId),
			name = player.DisplayName,
		})
	end

	return formatted
end

local function formatDictionary(dictionary: { [string]: string }): { { key: string, value: string } }
	local formatted = {}

	for key, value in dictionary do
		table.insert(formatted, {
			key = key,
			value = value,
		})
	end

	return formatted
end

-- while this could be seen like a security risk in some cases, it is only on the server;
-- only developers can abuse it, and they could do so regardless
function wrapper.init(data: WrapperData)
	wrapperData = data
end

function wrapper.create(
	personality: Personality & { name: string },
	users: { Player }?,
	persistenceToken: string?
): ConversationData?
	local response: Response<ConversationData> = sendRequest(`{wrapperData.url}/api/conversation/create`, "POST", {
		persistenceToken = persistenceToken,
		personality = personality,
		users = users and formatUsers(users) or {},
	}, {
		Authorization = wrapperData.auth,
	})

	if not response.success then
		warn(`{constants.ENGINE_LOG_PREFIX} Failed to create conversation: {response.status} {response.message}`)
		return nil
	end

	return response.body
end

function wrapper.send(
	conversation: ConversationData,
	message: string,
	context: { [string]: string }?,
	player: Player
): { flagged: boolean, content: string }?
	local response: Response<{ flagged: boolean, content: string }> = sendRequest(
		`{wrapperData.url}/api/conversation/send`,
		"POST",
		{
			secret = conversation.secret,
			context = context and formatDictionary(context) or {},
			message = message,
			playerId = tostring(player.UserId),
		},
		{
			Authorization = wrapperData.auth,
		}
	)

	if not response.success then
		warn(
			`{constants.ENGINE_LOG_PREFIX} Failed to send message to conversation {conversation.id}: {response.status} {response.message}`
		)
		return nil
	end

	return response.body
end

function wrapper.update(conversation: ConversationData, users: { Player }?, prompt: string?): boolean
	local response: Response<nil> = sendRequest(`{wrapperData.url}/api/conversation/update`, "POST", {
		secret = conversation.secret,
		users = users and formatUsers(users) or {},
		prompt = prompt,
	}, {
		Authorization = wrapperData.auth,
	})

	if not response.success then
		warn(
			`{constants.ENGINE_LOG_PREFIX} Failed to update conversation {conversation.id}: {response.status} {response.message}`
		)
	end

	return response.success
end

function wrapper.finish(conversation: ConversationData): boolean
	local response: Response<nil> = sendRequest(`{wrapperData.url}/api/conversation/finish`, "POST", {
		secret = conversation.secret,
	}, {
		Authorization = wrapperData.auth,
	})

	if not response.success then
		warn(
			`{constants.ENGINE_LOG_PREFIX} Failed to finish conversation {conversation.id}: {response.status} {response.message}`
		)
	end

	return response.success
end

type Response<T> = sendRequest.Response<T>

type FormattedPlayer = {
	id: string,
	name: string,
}

type ConversationData = {
	id: string,
	secret: string,
}

export type Personality = {
	bio: { string },
	lore: { string },
	knowledge: { string },
	messageExamples: { { { user: string, content: string } } },
}

export type WrapperData = {
	auth: Secret | string,
	url: string,
}

return wrapper
