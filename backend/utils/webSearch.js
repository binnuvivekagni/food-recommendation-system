import { tool } from "@langchain/core/tools";
import { TavilyClient } from "tavily";
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const client = new TavilyClient({ apiKey: process.env.TAVILY_API_KEY });

const webSearchTool = tool(
  async ({ query }) => {
    const response = await client.search(query);
    return response.results.map(r => `${r.title}: ${r.content}`).join('\n');
  },
  {
    name: "web_search",
    description: "Search the web for information about food nutrition and other details",
    schema: z.object({
      query: z.string(),
    }),
  }
);

export { webSearchTool };