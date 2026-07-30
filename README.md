# Private Pulse

Private Pulse is a browser-only anonymous survey app built for Midnight preview. It lets you deploy a survey contract from the wallet, share the contract address, and collect responses without storing responder identity.

## Link Section

Use this section to keep the important project links in one place.

| Item | Link |
| --- | --- |
| Live app | https://private-pulse-five.vercel.app/ |
| Demo video | https://drive.google.com/file/d/1KGRYro-DwMwImOBruMevO3cyoiyvhAlW/view?usp=sharing |
| Contract link | `44f8bcc34b25c66e937a809389df7808159c8a93c37f9e4417aae3be368cef65` |
| Frontend repo entry | [frontend/app/page.tsx](frontend/app/page.tsx) |
| Contract source | [contract/src/anonymous-feedback.compact](contract/src/anonymous-feedback.compact) |

## Overview

- Connects to Midnight preview through the 1AM browser wallet
- Deploys the survey contract in-browser
- Publishes answers anonymously
- Shows anonymous responses below the survey
- Uses the indexer to refresh contract state and response lists

## Screenshots

Add project screenshots here so the README doubles as a demo page.

Recommended locations:

- `docs/screenshots/home.png`
- `docs/screenshots/deploy.png`
- `docs/screenshots/survey.png`

Example:

```md
![Home screen](docs/screenshots/home.png)
![Deploy screen](docs/screenshots/deploy.png)
![Survey screen](docs/screenshots/survey.png)
```

## Architecture

Private Pulse is split into three layers:

1. Contract layer
   - Defines the anonymous survey state and response storage
   - Lives in [contract/src/anonymous-feedback.compact](contract/src/anonymous-feedback.compact)

2. Frontend integration layer
   - Connects to the wallet, compiles contract assets, deploys surveys, and submits responses
   - Lives in the files listed in the contract integration section below

3. UI layer
   - Renders the landing page, deploy flow, survey form, and anonymous response feed
   - Lives in [frontend/app/page.tsx](frontend/app/page.tsx), [frontend/app/deploy/DeployClient.tsx](frontend/app/deploy/DeployClient.tsx), and [frontend/app/survey/SurveyClient.tsx](frontend/app/survey/SurveyClient.tsx)

High-level flow:

```text
Browser UI
  -> 1AM Wallet
  -> Midnight preview network
  -> Compiled contract + ZK assets
  -> Indexer query for contract state
  -> Anonymous response feed in the UI
```

## Contract Details

Contract address:

`44f8bcc34b25c66e937a809389df7808159c8a93c37f9e4417aae3be368cef65`

What the contract stores:

- `surveyId`
- `question`
- `questionCount`
- `responseCount`
- `anonymousResponses`

How responses work:

- Each response is truncated/padded to 128 bytes on the frontend before submission
- A random 32-byte salt is used to derive a response ID
- The contract stores the response text under that anonymous ID
- No responder identity is written to contract state

Main contract circuit:

- `submitResponse(_response, _responseSalt)`

## How To Use

### Install

```bash
npm install
```

### Run locally

From the frontend app:

```bash
npm run dev
```

Open:

- `http://localhost:3000` for the survey page
- `/deploy` for the deploy flow

### Build

```bash
npm run build
```

### Contract workflow

If you change the contract source, regenerate the managed assets before testing the UI:

```bash
npm run compile:contract
npm run sync:assets
```

## Contract Integration Files

These are the main files that connect the frontend to the contract:

- [frontend/lib/contract.ts](frontend/lib/contract.ts) - default deployed contract address
- [frontend/lib/midnight.ts](frontend/lib/midnight.ts) - wallet/session setup, network config, provider wiring
- [frontend/lib/survey.ts](frontend/lib/survey.ts) - deploy flow and contract snapshot decoding
- [frontend/lib/survey-tx.ts](frontend/lib/survey-tx.ts) - response submission and anonymous response fetching
- [frontend/scripts/sync-zk-assets.mjs](frontend/scripts/sync-zk-assets.mjs) - copies generated ZK assets into `public/zk/anonymous-feedback`
- [frontend/contract/src/index.ts](frontend/contract/src/index.ts) - generated contract entry point for the frontend
- [frontend/contract/src/managed/anonymous-feedback/](frontend/contract/src/managed/anonymous-feedback/) - generated contract artifacts, keys, and ZK IR

Contract-side source files:

- [contract/src/anonymous-feedback.compact](contract/src/anonymous-feedback.compact)
- [contract/src/index.ts](contract/src/index.ts)
- [contract/src/witnesses.ts](contract/src/witnesses.ts)

## Repo Structure

- `contract/` - Compact source and generated contract artifacts
- `frontend/` - Next.js app, wallet integration, and UI
- `frontend/public/zk/anonymous-feedback/` - runtime ZK assets served to the browser

## Notes

- This app is built against Midnight preview, not mainnet
- The frontend uses the 1AM browser wallet
- Anonymous responses are public, but identity is not stored
- Surveys deployed before the anonymous response feed existed only contain commitments and should be redeployed if you want to show response text
- The current deployed contract address is stored in [frontend/lib/contract.ts](frontend/lib/contract.ts)

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Midnight compact contract tooling
- 1AM wallet integration

## Helpful Commands

```bash
npm run lint
npm run build
npm run compile:contract
npm run sync:assets
```
