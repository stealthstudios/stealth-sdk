local HttpService = game:GetService("HttpService")

local constants = require("@src/constants")

local function serializeBody(body: Body): string
	return HttpService:JSONEncode(body)
end

local function deserializeBody<T>(body: T): T
	local success, decodedBody = pcall(function()
		return HttpService:JSONDecode(body)
	end)

	if not success then
		return body
	end

	return decodedBody
end

local function sendRequest<T>(url: string, method: Method, body: Body, headers: Headers): Response<T>
	if not url then
		warn(`{constants.ENGINE_LOG_PREFIX} URL is not set!`)
		return {
			success = false,
			status = 500,
		}
	end

	headers = headers or {}
	headers["Content-Type"] = "application/json"

	local success, response = pcall(function()
		return HttpService:RequestAsync({
			Url = url,
			Method = method,
			Headers = headers,
			Body = serializeBody(body),
		})
	end)

	if not success then
		return {
			success = false,
			status = 500,
		}
	end

	local deserializedResponse = deserializeBody(response.Body)
	local message = typeof(deserializedResponse) == "table" and deserializedResponse.message or nil

	return {
		success = response.Success,
		status = response.StatusCode,
		message = message,
		body = deserializedResponse,
	}
end

type PrimitiveValue = string | number | boolean | nil

type Method = "GET" | "POST" | "PUT" | "DELETE"

type Body = {
	[PrimitiveValue]: Body | PrimitiveValue,
}

type Headers = {
	[string]: string | Secret,
}

export type Response<T> = {
	success: boolean,
	status: number,
	message: string?,
	body: T?,
}

return sendRequest
