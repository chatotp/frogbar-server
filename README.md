# frogbar Client
## Requirements

The versions represent the versions used during the development phase.

- pnpm \[9.14.2\]
- Node.js \[22.9.0\]
- GEMINI_API_KEY

## Running the client

1. Set cors address of server to your domain or IP on which client is hosted.
```python
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173"
    }
})
```

2. Set your `GEMINI_API_KEY` by creating a
- .env file (change `<GEMINI_API_KEY>` with your token)
```
GOOGLE_GEN_AI_KEY=<GEMINI_API_KEY>
```
- environment variable `GOOGLE_GEN_AI_KEY` (not recommended)

3. Install dependencies
```
pnpm install
```

4. Run the server using following command:
- Dev Environment:
```
pnpm run dev
```

- Production Environment:
```
pnpm run start
```