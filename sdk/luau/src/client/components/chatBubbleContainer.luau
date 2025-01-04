local fusion = require("@packages/fusion")
local Children = fusion.Children

local chatBubble = require("@client/components/chatBubble")

local function chatBubbleContainer(scope: fusion.Scope<typeof(fusion)>, props: props): Instance
	local adorneeDistance = scope:Value(0)

	local function updateAdorneeDistance()
		local camera = workspace.CurrentCamera
		if not camera then
			return
		end

		adorneeDistance:set(math.round((camera.CFrame.Position - props.adornee.Position).Magnitude))
	end

	updateAdorneeDistance()
	table.insert(scope, workspace.CurrentCamera:GetPropertyChangedSignal("CFrame"):Connect(updateAdorneeDistance))
	table.insert(scope, props.adornee:GetPropertyChangedSignal("CFrame"):Connect(updateAdorneeDistance))

	return scope:New("BillboardGui")({
		Adornee = props.adornee,
		Size = UDim2.fromOffset(500, 200),
		SizeOffset = Vector2.new(0, 0.5),
		StudsOffsetWorldSpace = Vector3.new(0, props.verticalOffset, 0),
		Parent = props.parent,
		ResetOnSpawn = false,
		[Children] = {
			scope:New("Frame")({
				Name = "BubbleChatList",
				BackgroundTransparency = 1,
				Size = UDim2.fromScale(1, 1),
				[Children] = {
					scope:New("UIPadding")({
						Name = "CaretPadding",
						PaddingBottom = UDim.new(0, 8),
					}),

					scope:New("UIListLayout")({
						Name = "Layout",
						HorizontalAlignment = Enum.HorizontalAlignment.Center,
						Padding = UDim.new(0, 6),
						SortOrder = Enum.SortOrder.LayoutOrder,
						VerticalAlignment = Enum.VerticalAlignment.Bottom,
					}),

					scope:ForPairs(props.chats, function(_, forPairsScope, index, chat)
						chat.scope = forPairsScope

						return index,
							chatBubble({
								layoutOrder = index,
								chat = chat,
								transparent = forPairsScope:Computed(function(use)
									-- transparent if the current chat is more than 3 chats away from the last chat
									local highestChatIndex = 0

									for i, _ in pairs(use(props.chats)) do
										highestChatIndex = math.max(highestChatIndex, i)
									end

									return index <= highestChatIndex - 3
								end),
								caretEnabled = forPairsScope:Computed(function(use)
									local highestChatIndex = 0

									for i, _ in pairs(use(props.chats)) do
										highestChatIndex = math.max(highestChatIndex, i)
									end

									return index == highestChatIndex
								end),
								adorneeDistance = adorneeDistance,
								distanceMultiplier = props.distanceMultiplier,
							})
					end),
				},
			}),
		},
	})
end

type props = {
	chats: fusion.Value<fusion.Scope<any>, { chatBubble.Chat }>,
	adornee: BasePart | Attachment,
	verticalOffset: number,
	parent: Instance,
	distanceMultiplier: number,
}

return chatBubbleContainer
