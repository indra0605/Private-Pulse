# Private Pulse

Private Pulse is a browser-only anonymous survey app for Midnight preview. Use 1AM Wallet, launch a survey from `/deploy`, then answer it from the main page.

Default contract address:

`44f8bcc34b25c66e937a809389df7808159c8a93c37f9e4417aae3be368cef65`

## What it does

- Connects to **Midnight preview** with 1AM browser extension
- Sets network ID before wallet or contract work
- Deploys anonymous survey contract through wallet proving flow
- Shows deployed contract address on screen
- Publishes response text without storing the responder's identity
- Shows every anonymous response beneath the survey

> Contract schema changed: surveys deployed before the anonymous response feed was added
> only contain response commitments and must be redeployed to show response text.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to answer the Private Pulse survey.
Use `/deploy` to launch a new survey.

## Build

```bash
npm run build
```

Build flow:

1. Compile Compact contract from `../contract/src/anonymous-feedback.compact`
2. Sync generated ZK assets into `public/zk/anonymous-feedback`
3. Run `next build --webpack`

## Notes

- Contract bundle is compiled against `@midnight-ntwrk/compact-runtime@0.16.0`
- Frontend package pins Midnight deps to the matching reference flow
- If you change contract source, rerun build or `npm run compile:contract && npm run sync:assets`
