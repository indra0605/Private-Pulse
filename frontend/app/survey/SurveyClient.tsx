'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

import { DEFAULT_CONTRACT_ADDRESS } from '@/lib/contract';
import { createConnectedSession, detectWallet, TARGET_NETWORK_ID } from '@/lib/midnight';
import type { ConnectedSession } from '@/lib/midnight';
import { getSurveySnapshot, submitFeedback } from '@/lib/survey-tx';
import { utf8ByteLength } from '@/lib/codec';

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

    const refresh = () => {
      getSurveySnapshot(session.config.indexerUri, DEFAULT_CONTRACT_ADDRESS)
        .then((data) => {
          if (!ignore) setSnapshot(data);
        })
        .catch((err) => {
          if (!ignore) setError(err instanceof Error ? err.message : String(err));
        });
    };

    refresh();
    const refreshTimer = window.setInterval(refresh, 15_000);

    return () => {
      ignore = true;
      window.clearInterval(refreshTimer);
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
      const previousCount = snapshot?.responseCount ?? BigInt(0);
      await submitFeedback(session, feedback, DEFAULT_CONTRACT_ADDRESS);
      let data = await getSurveySnapshot(session.config.indexerUri, DEFAULT_CONTRACT_ADDRESS);

      for (
        let attempt = 0;
        attempt < 12 && (data?.responseCount ?? BigInt(0)) <= previousCount;
        attempt += 1
      ) {
        await new Promise((resolve) => window.setTimeout(resolve, 1_000));
        data = await getSurveySnapshot(session.config.indexerUri, DEFAULT_CONTRACT_ADDRESS);
      }

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
  }, [connectWallet, feedback, session, snapshot]);

  const question = snapshot?.question.trim() ?? '';
  const questionReady = Boolean(question);
  const responseBytes = utf8ByteLength(feedback);
  const responseTooLong = responseBytes > 128;
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
          <p>This survey uses 1AM Wallet to publish your answer without storing your identity.</p>
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
          {!session && <p className="question-hint">Connect once to reveal the question and answer without attaching your identity.</p>}
        </div>

        {submitted ? (
          <div className="success-panel" role="status">
            <span className="success-check" aria-hidden="true">✓</span>
            <div>
              <h2>Answer sent</h2>
              <p>Your answer is now visible below as an anonymous response.</p>
            </div>
          </div>
        ) : (
          <>
            <label className="answer-field">
              <span className="answer-label">
                <span>Your answer</span>
                <span className={responseTooLong ? 'answer-count answer-count--error' : 'answer-count'}>
                  {responseBytes}/128 bytes
                </span>
              </span>
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                rows={5}
                disabled={!questionReady}
                aria-invalid={responseTooLong}
                placeholder={questionReady ? 'Write what you really think…' : 'Question loads after wallet connection'}
              />
            </label>

            <button
              type="button"
              onClick={submit}
              disabled={connecting || busy || Boolean(session && (!questionReady || isBlank(feedback) || responseTooLong))}
              className="survey-action"
            >
              {buttonLabel}
              <span aria-hidden="true">→</span>
            </button>
          </>
        )}

        {error && <p className="survey-error" role="alert">{error}</p>}

        <footer className="survey-footer">
          <span>No identity stored</span>
          {snapshot && <span>{snapshot.responseCount.toString()} answers</span>}
        </footer>
      </section>

      <section className="responses-section" aria-labelledby="responses-title">
        <div className="responses-heading">
          <div>
            <p className="survey-kicker">Shared openly</p>
            <h2 id="responses-title">Anonymous responses</h2>
          </div>
          <span className="responses-total" aria-label={`${snapshot?.responses.length ?? 0} responses`}>
            {snapshot?.responses.length ?? 0}
          </span>
        </div>

        {!session ? (
          <div className="responses-empty">
            <span aria-hidden="true">•••</span>
            <p>Connect your wallet to reveal the question and its anonymous responses.</p>
          </div>
        ) : snapshot?.responses.length ? (
          <ol className="responses-list">
            {snapshot.responses.map((response) => (
              <li className="response-card" key={response.id}>
                <div className="response-meta">
                  <span className="anonymous-avatar" aria-hidden="true">A</span>
                  <span>Anonymous response</span>
                  <span className="response-number">ID {response.id.slice(0, 6)}</span>
                </div>
                <p>{response.text}</p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="responses-empty">
            <span aria-hidden="true">✦</span>
            <p>No responses yet. The first honest answer can be yours.</p>
          </div>
        )}
      </section>
    </div>
  );
}
