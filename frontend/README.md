# Private Pulse

Private Pulse is a browser-only anonymous survey app for Midnight preview. Use 1AM Wallet, launch a survey from `/deploy`, then answer it from the main page.

Default contract address:

`2856cddb07f45dcda37a4985fc095808ac57b1ae9fced2103a896acd894f8b7c`

## What it does

- Connects to **Midnight preview** with 1AM browser extension
- Sets network ID before wallet or contract work
- Deploys anonymous survey contract through wallet proving flow
- Shows deployed contract address on screen
- Lets anyone paste the contract address and submit feedback

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
