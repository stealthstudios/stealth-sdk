local fusion = require("@packages/fusion")
local Children = fusion.Children

local chatBubble = require("@client/components/chatBubble")

local function chatBubbleContainer(scope: fusion.Scope<typeof(fusion)>, props: props): BillboardGui
	local adorneeDistance = scope:Value(0)

	local function updateAdorneeDistance()
		-- we have to re-fetch camera each time; it could change!
		local camera = workspace.CurrentCamera

		if not camera then
			return
		end

		adorneeDistance:set(math.round((camera.CFrame.Position - props.adornee.Position).Magnitude))
	end

	updateAdorneeDistance()
	table.insert(scope, workspace.CurrentCamera:GetPropertyChangedSignal("CFrame"):Connect(updateAdorneeDistance))
	table.insert(scope, props.adornee:GetPropertyChangedSignal("CFrame"):Connect(updateAdorneeDistance))

	local billboardGui = scope:New("BillboardGui")({
		Adornee = props.adornee,
		AlwaysOnTop = true,
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
						-- we want to allow other values to use this scope, so we expose it like this
						chat.scope = forPairsScope

						return index,
							chatBubble({
								layoutOrder = index,
								chat = chat,
								caretEnabled = forPairsScope:Computed(function(use)
									return index == #use(props.chats)
								end),
								adorneeDistance = adorneeDistance,
								distanceMultiplier = props.distanceMultiplier,
							})
					end),
				},
			}),
		},
	})

	return billboardGui
end

type props = {
	chats: fusion.Value<fusion.Scope<any>, { chatBubble.Chat }>,
	adornee: BasePart | Attachment,
	verticalOffset: number,
	parent: Instance,
	distanceMultiplier: number,
}

return chatBubbleContainer
