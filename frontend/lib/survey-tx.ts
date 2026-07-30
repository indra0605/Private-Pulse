'use client';

import { ContractState } from '@midnight-ntwrk/compact-runtime';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { submitCallTxAsync } from '@midnight-ntwrk/midnight-js-contracts';

import { Survey } from '@/contract/src/index';
import { decodePaddedUtf8, encodePaddedUtf8, fromHex, toHex } from './codec';
import type { ConnectedSession } from './midnight';

const SURVEY_CIRCUIT_ASSETS = '/zk/anonymous-feedback/';

function makeCompiledContract() {
  return CompiledContract.make('anonymous-feedback', Survey.Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(SURVEY_CIRCUIT_ASSETS),
  ) as any;
}

export type SurveySnapshot = {
  surveyId: string;
  question: string;
  questionCount: bigint;
  responseCount: bigint;
  responses: Array<{
    id: string;
    text: string;
  }>;
};

export async function submitFeedback(
  session: ConnectedSession,
  response: string,
  contractAddress: string,
): Promise<string> {
  const compiledContract = makeCompiledContract();
  const responseBytes = encodePaddedUtf8(response, 128, 'Response');
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
  const responses = Array.from(ledger.anonymousResponses, ([id, response]) => ({
    id: toHex(id),
    text: decodePaddedUtf8(response),
  })).filter(({ text }) => Boolean(text));

  return {
    surveyId: toHex(ledger.surveyId),
    question: decodePaddedUtf8(ledger.question),
    questionCount: ledger.questionCount,
    responseCount: ledger.responseCount,
    responses,
  };
}
