/** Klien OpenAI minimal via fetch langsung (tanpa SDK tambahan). */
export interface IChatTool {
  type: `function`
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface IChatMessage {
  role: `system` | `user` | `assistant` | `tool`
  content: string | null
  tool_calls?: {id: string; type: `function`; function: {name: string; arguments: string}}[]
  tool_call_id?: string
}

export interface IChatResult {
  message: IChatMessage
}

export class OpenAIClient {
  static fetchFn: typeof fetch = fetch

  static async chat(
    apiKey: string,
    model: string,
    messages: IChatMessage[],
    tools: IChatTool[],
  ): Promise<IChatResult> {
    const res = await OpenAIClient.fetchFn(`https://api.openai.com/v1/chat/completions`, {
      method: `POST`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": `application/json`,
      },
      body: JSON.stringify({
        model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? `auto` : undefined,
        temperature: 0.7,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => ``)
      throw new Error(`OpenAI chat ${res.status}: ${body.slice(0, 200)}`)
    }
    const data = (await res.json()) as {choices?: {message?: IChatMessage}[]}
    const message = data.choices?.[0]?.message
    if (!message) throw new Error(`OpenAI chat: empty response`)
    return {message}
  }
}
