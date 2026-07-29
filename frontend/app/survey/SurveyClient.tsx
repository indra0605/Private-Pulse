'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

import { DEFAULT_CONTRACT_ADDRESS } from '@/lib/contract';
import { createConnectedSession, detectWallet, TARGET_NETWORK_ID } from '@/lib/midnight';
import type { ConnectedSession } from '@/lib/midnight';
import { getSurveySnapshot, submitFeedback } from '@/lib/survey-tx';

function isBlank(text: string) {
  return !text.trim();
}

export default function SurveyClient() {
  const [session, setSession] = useState<ConnectedSession | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [walletInstalled, setWalletInstalled] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getSurveySnapshot>>>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    detectWallet().then((wallet) => setWalletInstalled(wallet !== null));
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    let ignore = false;

    getSurveySnapshot(session.config.indexerUri, DEFAULT_CONTRACT_ADDRESS)
      .then((data) => {
        if (!ignore) setSnapshot(data);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      ignore = true;
    };
  }, [session]);

  const connectWallet = useCallback(async () => {
    setConnecting(true);
    setError('');
    try {
      const wallet = await detectWallet();
      if (!wallet) {
        setWalletInstalled(false);
        return;
      }
      setNetworkId(TARGET_NETWORK_ID);
      const api = await wallet.connect(TARGET_NETWORK_ID);
      setSession(await createConnectedSession(api, '/zk/anonymous-feedback/'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect wallet.');
    } finally {
      setConnecting(false);
    }
  }, []);

  const submit = useCallback(async () => {
    if (!session) {
      await connectWallet();
      return;
    }

    setBusy(true);
    setError('');
    try {
      await submitFeedback(session, feedback, DEFAULT_CONTRACT_ADDRESS);
      const data = await getSurveySnapshot(session.config.indexerUri, DEFAULT_CONTRACT_ADDRESS);
      if (mountedRef.current) {
        setSnapshot(data);
        setFeedback('');
        setSubmitted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [connectWallet, feedback, session]);

  const question = snapshot?.question.trim() ?? '';
  const questionReady = Boolean(question);
  const buttonLabel = connecting
    ? 'Connecting…'
    : busy
      ? 'Sealing your answer…'
      : !session
        ? 'Connect wallet to answer'
        : 'Send anonymous answer';

  if (walletInstalled === false) {
    return (
      <div className="survey-shell">
        <section className="survey-card survey-card--empty">
          <span className="privacy-mark">Private Pulse</span>
          <h1>Install 1AM Wallet to answer</h1>
          <p>This survey uses 1AM Wallet to keep your response private.</p>
          <a className="survey-action" href="https://releases.dev.midnight.network/" target="_blank" rel="noreferrer">
            Get 1AM Wallet
          </a>
        </section>
      </div>
    );
  }

  return (
    <div className="survey-shell">
      <header className="survey-header">
        <span className="survey-logo" aria-label="Private Pulse">
          <span aria-hidden="true">P</span>
          Private Pulse
        </span>
        <span className="privacy-mark">
          <span aria-hidden="true">●</span>
          Anonymous
        </span>
      </header>

      <section className="survey-card" aria-labelledby="survey-question">
        <div className="question-block">
          <p className="survey-kicker">One-question survey</p>
          <h1 id="survey-question">
            {!session ? 'Ready to share your honest answer?' : question || 'Loading today’s question…'}
          </h1>
          {!session && <p className="question-hint">Connect once to reveal question and answer privately.</p>}
        </div>

        {submitted ? (
          <div className="success-panel" role="status">
            <span className="success-check" aria-hidden="true">✓</span>
            <div>
              <h2>Answer sent</h2>
              <p>Your response stays private. Thanks for sharing.</p>
            </div>
          </div>
        ) : (
          <>
            <label className="answer-field">
              <span>Your answer</span>
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                rows={5}
                disabled={!questionReady}
                placeholder={questionReady ? 'Write what you really think…' : 'Question loads after wallet connection'}
              />
            </label>

            <button
              type="button"
              onClick={submit}
              disabled={connecting || busy || Boolean(session && (!questionReady || isBlank(feedback)))}
              className="survey-action"
            >
              {buttonLabel}
              <span aria-hidden="true">→</span>
            </button>
          </>
        )}

        {error && <p className="survey-error" role="alert">{error}</p>}

        <footer className="survey-footer">
          <span>Encrypted before sending</span>
          {snapshot && <span>{snapshot.responseCount.toString()} answers</span>}
        </footer>
      </section>
    </div>
  );
}
