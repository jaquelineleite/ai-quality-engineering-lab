type LLMResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type LLMOptions = {
  temperature?: number;
  maxTokens?: number;
};

export async function generateWithLLM(
  prompt: string,
  options: LLMOptions = {}
): Promise<string> {
  const apiUrl = process.env.LLM_API_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;

  const temperature =
    options.temperature ?? 0.2;

  const maxTokens =
    options.maxTokens ?? 300;

  if (!apiUrl) {
    throw new Error(
      "LLM_API_URL is not configured."
    );
  }

  if (!model) {
    throw new Error(
      "LLM_MODEL is not configured."
    );
  }

  const response = await fetch(apiUrl, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      ...(apiKey
        ? {
            Authorization: `Bearer ${apiKey}`,
          }
        : {}),
    },

    body: JSON.stringify({
      model,

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorBody =
      await response.text();

    throw new Error(
      `LLM request failed: ${response.status} ${errorBody}`
    );
  }

  const data =
    (await response.json()) as LLMResponse;

  const content =
    data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(
      "LLM returned an empty response."
    );
  }

  return content;
}