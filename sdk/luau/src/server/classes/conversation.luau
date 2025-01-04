local conversation = {}
conversation.__index = conversation

local wrapper = require("@server/wrapper")

function conversation.new(id: string, secret: string): Conversation
	return setmetatable({
		id = id,
		secret = secret,
		partakingPlayers = {},
		_finished = false,
	}, conversation)
end

function conversation.send(
	self: Conversation,
	player: Player,
	message: string,
	context: { [string]: string }?
): Response?
	local credentials: Credentials = {
		id = self.id,
		secret = self.secret,
	}

	return wrapper.send(credentials, message, context, player)
end

function conversation.finish(self: Conversation)
	if self._finished then
		return
	end

	self._finished = true
	wrapper.finish({
		id = self.id,
		secret = self.secret,
	})
end

function conversation.addPlayer(self: Conversation, player: Player)
	table.insert(self.partakingPlayers, player)
	wrapper.update({
		id = self.id,
		secret = self.secret,
	}, self.partakingPlayers)
end

function conversation.removePlayer(self: Conversation, player: Player)
	local index = table.find(self.partakingPlayers, player)
	if not index then
		return
	end

	table.remove(self.partakingPlayers, index)
	wrapper.update({
		id = self.id,
		secret = self.secret,
	}, self.partakingPlayers)
end

function conversation.getPlayers(self: Conversation): { Player }
	return self.partakingPlayers
end

function conversation.containsPlayer(self: Conversation, player: Player): boolean
	return table.find(self.partakingPlayers, player) ~= nil
end

function conversation.isEmpty(self: Conversation): boolean
	return #self.partakingPlayers == 0
end

type Credentials = {
	id: string,
	secret: string,
}

export type Response = {
	flagged: boolean,
	content: string,
	cancelled: boolean?,
	calls: {
		{
			name: string,
			parameters: {
				[string]: number | boolean | string,
			},
		}
	}?,
}

export type Conversation = typeof(setmetatable(
	{} :: {
		id: string,
		secret: string,
		partakingPlayers: { Player },
		_finished: boolean,
	},
	conversation
))

return conversation
