local TextService = game:GetService("TextService")

local fusion = require("@packages/fusion")
local Children = fusion.Children
local peek = fusion.peek

local textMap = {
	started = {
		text = "⏳ Thinking..",
		color = Color3.fromHex("#6b7280"),
	},
	received = {
		text = "You are not supposed to see this; please report this to the developer.",
		color = Color3.fromHex("#393b3d"),
	},
	flagged = {
		text = "❌ This response was flagged.",
		color = Color3.fromHex("#ef4444"),
	},
	cancelled = {
		text = "⚠️ The response was cancelled.",
		color = Color3.fromHex("#f59e0b"),
	},
}

local function lerp(a: number, b: number, t: number)
	return a + (b - a) * t
end

local function chatBubble(props: Props)
	local scope = props.chat.scope
	local status = props.chat.status
	local isOpen = props.chat.isOpen

	local text = scope:Computed(function(use)
		local content = use(props.chat.content)
		local currentStatus = use(status)
		local adorneeDistance = use(props.adorneeDistance) * props.distanceMultiplier

		if adorneeDistance >= 30 then
			return "..."
		end

		if content then
			return content
		end

		return textMap[use(currentStatus)].text
	end)

	local color = scope:Computed(function(use)
		return textMap[use(status)].color
	end)

	-- Returns a value between 0-1 representing chat bubble visibility based on distance
	local isVisible = scope:Computed(function(use)
		local distance = use(props.adorneeDistance) * props.distanceMultiplier
		local isCurrentlyOpen = use(isOpen)

		if not isCurrentlyOpen then
			return 1
		end

		if distance >= 100 then
			return 1
		end

		if distance >= 30 then
			return 0.2
		end

		return 0
	end)

	local textSize = scope:Value(Vector2.new(0, 0))

	local function updateTextSize()
		local newText = peek(text)
		local params = Instance.new("GetTextBoundsParams")
		params.Font =
			Font.new("rbxasset://fonts/families/BuilderSans.json", Enum.FontWeight.Medium, Enum.FontStyle.Normal)
		params.Text = newText
		params.Size = 20
		params.Width = 256
		params.RichText = true

		local bounds = TextService:GetTextBoundsAsync(params)
		textSize:set(bounds)
	end

	table.insert(scope, scope:Observer(text):onChange(updateTextSize))
	updateTextSize()

	local bubble = scope:New("Frame")({
		Name = "Bubble",
		AnchorPoint = Vector2.new(0.5, 0.5),
		BackgroundTransparency = 1,
		Position = UDim2.fromScale(1, 0.5),
		LayoutOrder = props.layoutOrder,
		Size = scope:Tween(
			scope:Computed(function(use)
				local size = use(textSize)
				if use(isOpen) then
					return UDim2.fromOffset(size.X + 32, size.Y + 16)
				end
				return UDim2.fromOffset(0, 0)
			end),
			TweenInfo.new(0.8, Enum.EasingStyle.Exponential, Enum.EasingDirection.Out)
		),
		[Children] = {
			scope:New("Frame")({
				Name = "ChatBubbleFrame",
				AnchorPoint = Vector2.new(0.5, 0),
				BackgroundColor3 = Color3.fromRGB(250, 250, 250),
				BackgroundTransparency = scope:Tween(
					scope:Computed(function(use)
						return lerp(0.1, 1, use(isVisible))
					end),
					TweenInfo.new(0.4, Enum.EasingStyle.Exponential, Enum.EasingDirection.Out)
				),
				BorderSizePixel = 0,
				ClipsDescendants = true,
				LayoutOrder = 1,
				Position = UDim2.fromScale(0.5, 0),
				Size = UDim2.fromScale(1, 1),
				[Children] = {
					scope:New("UICorner")({
						Name = "UICorner",
						CornerRadius = UDim.new(0, 12),
					}),

					scope:New("UIPadding")({
						Name = "Padding",
						PaddingBottom = UDim.new(0, 8),
						PaddingLeft = UDim.new(0, 8),
						PaddingRight = UDim.new(0, 8),
						PaddingTop = UDim.new(0, 8),
					}),

					scope:New("TextLabel")({
						Name = "Text",
						AnchorPoint = Vector2.new(0.5, 0.5),
						AutoLocalize = false,
						BackgroundTransparency = 1,
						FontFace = Font.new(
							"rbxasset://fonts/families/BuilderSans.json",
							Enum.FontWeight.Medium,
							Enum.FontStyle.Normal
						),
						LayoutOrder = 2,
						Position = UDim2.fromScale(0.5, 0.5),
						RichText = true,
						Size = UDim2.fromScale(1, 1),
						Text = text,
						TextColor3 = scope:Tween(
							color,
							TweenInfo.new(0.5, Enum.EasingStyle.Exponential, Enum.EasingDirection.Out)
						),
						TextTransparency = scope:Tween(
							scope:Computed(function(use)
								return lerp(0, 1, use(isVisible))
							end),
							TweenInfo.new(0.5, Enum.EasingStyle.Exponential, Enum.EasingDirection.Out)
						),
						TextSize = 20,
						TextWrapped = true,
					}),

					scope:New("UIListLayout")({
						Name = "UIListLayout",
						FillDirection = Enum.FillDirection.Horizontal,
						Padding = UDim.new(0, 8),
						SortOrder = Enum.SortOrder.LayoutOrder,
						VerticalAlignment = Enum.VerticalAlignment.Bottom,
					}),
				},
			}),

			scope:New("UIListLayout")({
				Name = "Layout",
				HorizontalAlignment = Enum.HorizontalAlignment.Center,
				Padding = UDim.new(0, 0),
				SortOrder = Enum.SortOrder.LayoutOrder,
			}),

			scope:New("ImageLabel")({
				Name = "Caret",
				BackgroundTransparency = 1,
				Image = "rbxasset://textures/ui/InGameChat/Caret.png",
				ImageColor3 = Color3.fromRGB(250, 250, 250),
				ImageTransparency = scope:Tween(
					scope:Computed(function(use)
						return lerp(0.1, 1, use(isVisible))
					end),
					TweenInfo.new(0.5, Enum.EasingStyle.Exponential, Enum.EasingDirection.Out)
				),
				LayoutOrder = 2,
				Size = scope:Tween(
					scope:Computed(function(use)
						return (use(isOpen) and use(props.caretEnabled)) and UDim2.fromOffset(9, 6)
							or UDim2.fromOffset(0, 0)
					end),
					TweenInfo.new(0.5, Enum.EasingStyle.Exponential, Enum.EasingDirection.Out)
				),
			}),
		},
	})

	isOpen:set(true)

	return bubble
end

export type Chat = {
	id: string,
	status: fusion.Value<fusion.Scope<typeof(fusion)>, string>,
	content: fusion.Value<fusion.Scope<typeof(fusion)>, string>,
	isOpen: fusion.Value<fusion.Scope<typeof(fusion)>, boolean>,
}

type Props = {
	chat: Chat & {
		scope: fusion.Scope<typeof(fusion)>,
	},
	caretEnabled: fusion.Value<fusion.Scope<typeof(fusion)>, boolean>,
	layoutOrder: number,
	adorneeDistance: fusion.Value<fusion.Scope<typeof(fusion)>, number>,
	distanceMultiplier: number,
}

return chatBubble
