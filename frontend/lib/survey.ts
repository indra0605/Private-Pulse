'use client';

import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { createUnprovenDeployTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';

import { Survey } from '@/contract/src/index';
import { encodePaddedUtf8 } from './codec';
import type { ConnectedSession } from './midnight';

const SURVEY_CIRCUIT_ASSETS = '/zk/anonymous-feedback/';
function makeCompiledContract() {
  return CompiledContract.make('anonymous-feedback', Survey.Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(SURVEY_CIRCUIT_ASSETS),
  ) as any;
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
  const questionBytes = encodePaddedUtf8(question, 64, 'Question');

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
