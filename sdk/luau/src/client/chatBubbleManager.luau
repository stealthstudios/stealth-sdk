local Players = game:GetService("Players")
local chatBubbleManager = {}

local fusion = require("@packages/fusion")
local scoped = fusion.scoped
local doCleanup = fusion.doCleanup
local peek = fusion.peek

local chatBubble = require("@client/components/chatBubble")
local chatBubbleContainer = require("@client/components/chatBubbleContainer")

local managedGuis: { [Model]: ManagedGui } = {}
local mappedIds: { [string]: { managedGui: ManagedGui, chat: chatBubble.Chat? } } = {}

function chatBubbleManager.new(id: string, model: Model): ManagedGui
	if managedGuis[model] then
		mappedIds[id] = {
			managedGui = managedGuis[model],
		}

		table.insert(managedGuis[model].scope, function()
			mappedIds[id] = nil
		end)

		return managedGuis[model]
	end

	local scope = scoped(fusion)
	local value = scope:Value({})

	local adornee = model.PrimaryPart or model:FindFirstChild("BillboardAdornee", true)
	local verticalOffset = model:GetAttribute("BubbleOffset") or 0
	local distanceMultiplier = model:GetAttribute("BubbleDistanceMultiplier") or 1

	managedGuis[model] = {
		gui = chatBubbleContainer(scope:innerScope(), {
			chats = value,
			adornee = adornee,
			verticalOffset = verticalOffset,
			parent = Players.LocalPlayer.PlayerGui,
			distanceMultiplier = distanceMultiplier,
		}),
		model = model,
		scope = scope,
		chats = value,
		-- fusion does some optimization with tables to ensure all indices are used, however,
		-- we use the index for the layoutorder and several other factors and as such it is important this does not happen
		-- so we keep track of the index ourselves
		chatIndex = 0,
	}

	mappedIds[id] = {
		managedGui = managedGuis[model],
	}

	table.insert(scope, function()
		managedGuis[model].gui:Destroy()
		managedGuis[model] = nil
		mappedIds[id] = nil
	end)

	return managedGuis[model]
end

function chatBubbleManager.get(id: string): { managedGui: ManagedGui, chat: chatBubble.Chat? }
	return mappedIds[id]
end

function chatBubbleManager.remove(id: string)
	local managedGuiData = mappedIds[id]
	if not managedGuiData then
		return
	end

	managedGuiData.chat.isOpen:set(false)

	task.delay(1, function()
		doCleanup(managedGuiData.chat)

		local newChats = peek(managedGuiData.managedGui.chats)
		for i, chat in newChats do
			if chat.id == id then
				newChats[i] = nil
				break
			end
		end

		managedGuiData.managedGui.chats:set(newChats)
	end)
end

type ManagedGui = {
	gui: BillboardGui,
	model: Model,
	scope: fusion.Scope<typeof(fusion)>,
	chats: fusion.Value<fusion.Scope<typeof(fusion)>, { chatBubble.Chat }>,
	chatIndex: number,
}

return chatBubbleManager
