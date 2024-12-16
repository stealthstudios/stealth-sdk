local wrapper = {}

local sendRequest = require("@api/sendRequest")

function wrapper.new(url: string, auth: Secret | string): Wrapper
	local self = {
		auth = auth,
		url = url,
	}

	return setmetatable(self, wrapper)
end

function wrapper.create(self: Wrapper, prompt: string, player: Player): ConversationData?
	local response: Response<ConversationData> = sendRequest(self.url, "POST", {
		prompt = prompt,
		player = player,
	}, {
		Authorization = self.auth,
	})

	if not response.success then
		return nil
	end

	return response.body
end

function wrapper.send() end

function wrapper.update() end

function wrapper.delete() end

type Response<T> = sendRequest.Response<T>

type Player = {
	id: string,
	name: string,
}

type ConversationData = {
	id: string,
	secret: string,
}

export type Conversation = {} & ConversationData

type Wrapper = typeof(setmetatable(
	{} :: {
		auth: Secret | string,
		url: string,
	},
	wrapper
))

return wrapper
