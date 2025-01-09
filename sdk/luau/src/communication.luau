local communication = {}

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local remote

if RunService:IsServer() then
	remote = Instance.new("RemoteEvent")
	remote.Name = "StealthSDK"
	remote.Parent = ReplicatedStorage
else
	remote = ReplicatedStorage:WaitForChild("StealthSDK")
end

function communication.send(topic: string, ...: any)
	if RunService:IsClient() then
		remote:FireServer(topic, ...)
	else
		remote:FireAllClients(topic, ...)
	end
end

function communication.sendToPlayer(player: Player, topic: string, ...: any)
	if not RunService:IsServer() then
		error("This function can only be called on the server")
	end

	remote:FireClient(player, topic, ...)
end

-- we can't really type this: client and server has diff first param
function communication.receive(callback: (...any) -> ())
	if RunService:IsClient() then
		remote.OnClientEvent:Connect(callback)
	else
		remote.OnServerEvent:Connect(callback)
	end
end

return communication
