'use client';

import { ContractState } from '@midnight-ntwrk/compact-runtime';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { submitCallTxAsync } from '@midnight-ntwrk/midnight-js-contracts';

import { Survey } from '@/contract/src/index';
import { fromHex, toHex } from './midnight';
import type { ConnectedSession } from './midnight';

const SURVEY_CIRCUIT_ASSETS = '/zk/anonymous-feedback/';

function makeCompiledContract() {
  return CompiledContract.make('anonymous-feedback', Survey.Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(SURVEY_CIRCUIT_ASSETS),
  ) as any;
}

function decodeText(bytes: Uint8Array): string {
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end -= 1;
  return new TextDecoder().decode(bytes.slice(0, end));
}

export type SurveySnapshot = {
  surveyId: string;
  question: string;
  questionCount: bigint;
  responseCount: bigint;
  responseSize: bigint;
};

export async function inputToBytes32(value: string): Promise<Uint8Array> {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Value required');
  const normalized = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
  if (/^[0-9a-fA-F]{64}$/.test(normalized)) return fromHex(normalized);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(trimmed));
  return new Uint8Array(digest);
}

export async function submitFeedback(
  session: ConnectedSession,
  response: string,
  contractAddress: string,
): Promise<string> {
  const compiledContract = makeCompiledContract();
  const responseBytes = await inputToBytes32(response);
  const salt = crypto.getRandomValues(new Uint8Array(32));

  const result = await (submitCallTxAsync as any)(session.providers, {
    compiledContract,
    contractAddress,
    circuitId: 'submitResponse',
    args: [responseBytes, salt],
  });

  const txId = result?.txId ?? result?.transactionId ?? result?.id;
  return typeof txId === 'string' && txId ? txId : contractAddress;
}

export async function getSurveySnapshot(queryUrl: string, contractAddress: string): Promise<SurveySnapshot | null> {
  const res = await fetch(queryUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      query: `query($address: HexEncoded!) { contractAction(address: $address) { state } }`,
      variables: { address: contractAddress },
    }),
  });
  const payload = await res.json();
  const stateHex = payload?.data?.contractAction?.state;
  if (!stateHex) return null;

  const contractState = ContractState.deserialize(fromHex(stateHex));
  const ledger = Survey.ledger(contractState.data);
  return {
    surveyId: toHex(ledger.surveyId),
    question: decodeText(ledger.question),
    questionCount: ledger.questionCount,
    responseCount: ledger.responseCount,
    responseSize: ledger.responseCommitments.size(),
  };
}
