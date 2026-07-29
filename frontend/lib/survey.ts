'use client';

import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { createUnprovenDeployTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';

import { Survey } from '@/contract/src/index';
import type { ConnectedSession } from './midnight';

const SURVEY_CIRCUIT_ASSETS = '/zk/anonymous-feedback/';
function makeCompiledContract() {
  return CompiledContract.make('anonymous-feedback', Survey.Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(SURVEY_CIRCUIT_ASSETS),
  ) as any;
}

function encodeQuestion(question: string): Uint8Array {
  const trimmed = question.trim();
  if (!trimmed) throw new Error('Question required');

  const encoded = new TextEncoder().encode(trimmed);
  if (encoded.length > 64) {
    throw new Error('Question must be 64 bytes or fewer');
  }

  const padded = new Uint8Array(64);
  padded.set(encoded);
  return padded;
}

function generateSurveyId(): Uint8Array {
  const surveyId = new Uint8Array(32);
  crypto.getRandomValues(surveyId);
  return surveyId;
}

export async function deploySurvey(
  session: ConnectedSession,
  question: string,
  questionCount: bigint,
): Promise<{ contractAddress: string }> {
  const compiledContract = makeCompiledContract();
  const surveyId = generateSurveyId();
  const questionBytes = encodeQuestion(question);

  const deployTxData = await (createUnprovenDeployTx as any)(
    { zkConfigProvider: session.providers.zkConfigProvider, walletProvider: session.providers.walletProvider },
    {
      compiledContract,
      args: [surveyId, questionBytes, questionCount],
    },
  );

  const contractAddress = deployTxData.public.contractAddress as string;

  await (submitTxAsync as any)(session.providers, { unprovenTx: deployTxData.private.unprovenTx });

  return { contractAddress };
}
