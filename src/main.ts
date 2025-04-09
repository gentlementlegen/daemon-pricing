import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// import worker from "./worker.ts";

// if (!worker || typeof worker.fetch !== "function") {
//   console.error("Error: Could not load fetch handler from src/worker.ts. Ensure it has a default export with a fetch method.");
//   Deno.exit(1);
// }

const PORT = 4000;
console.log(`HTTP server running. Access it at: http://localhost:${PORT}/`);

serve(
  async (request: Request) => {
    try {
      // const env = Deno.env.toObject();

      console.log(`Received request: ${request.method} ${request.url}`);
      request.headers.forEach((value, key) => {
        console.log(` Header: ${key}: ${value}`);
      });

      // const response = await worker.fetch(request, env);
      // console.log(`Responding with status: ${response.status}`);
      // return response;
      return new Response("Ok", { status: 200 });
    } catch (error) {
      console.error("Error during request handling:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
  { port: PORT }
);
