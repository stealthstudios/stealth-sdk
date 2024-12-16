local HttpService = game:GetService("HttpService")

export type Response<T> = {
	success: boolean,
	status: number,
	body: T?,
}

type Body = {
	[string]: Body | PrimitiveValue,
}

type Headers = {
	[string]: string | Secret,
}

type PrimitiveValue = string | number | boolean

type Method = "GET" | "POST" | "PUT" | "DELETE"

return function<T>(url: string, method: Method, body: Body, headers: Headers): Response<T>
	local success, response = pcall(function()
		return HttpService:RequestAsync({
			Url = url,
			Method = method,
			Headers = headers,
			Body = body,
		})
	end)

	if not success then
		return {
			success = false,
			status = 500,
		}
	end

	return {
		success = response.Success,
		status = response.Status,
		body = response.Body,
	}
end
