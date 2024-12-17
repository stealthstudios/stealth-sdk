local RunService = game:GetService("RunService")

return {
	server = function()
		if not RunService:IsServer() then
			error("This function can only be called on the server")
		end

		return require("@server")
	end,
	client = function()
		if not RunService:IsClient() then
			error("The client engine can only be imported on the client")
		end

		return require("@client")
	end,
}
