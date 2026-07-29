'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

import { createConnectedSession, detectWallet, pollForState, TARGET_NETWORK_ID } from '@/lib/midnight';
import type { ConnectedSession } from '@/lib/midnight';
import { deploySurvey } from '@/lib/survey';

function truncateAddress(value: string, visible = 6) {
  if (value.length <= visible * 2 + 3) return value;
  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}

export default function DeployClient() {
  const [session, setSession] = useState<ConnectedSession | null>(null);
  const [question, setQuestion] = useState('');
  const [questionCount, setQuestionCount] = useState('5');
  const [contractAddress, setContractAddress] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [walletInstalled, setWalletInstalled] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    detectWallet().then((wallet) => setWalletInstalled(wallet !== null));
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const withLoading = useCallback(async <T,>(
    message: string,
    fn: (setStatus: (value: string) => void) => Promise<T>,
  ): Promise<T> => {
    setBusy(true);
    setError('');
    setStatusMessage(message);
    try {
      return await fn((value: string) => {
        if (mountedRef.current) setStatusMessage(value);
      });
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      if (mountedRef.current) {
        setBusy(false);
        setStatusMessage('');
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setConnecting(true);
    setError('');
    try {
      const wallet = await detectWallet();
      if (!wallet) {
        setError('1AM wallet not detected. Install browser extension first.');
        return;
      }
      setNetworkId(TARGET_NETWORK_ID);
      const api = await wallet.connect(TARGET_NETWORK_ID);
      setSession(await createConnectedSession(api, '/zk/anonymous-feedback/'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, []);

  const handleDeploy = useCallback(async () => {
    if (!session) return;
    await withLoading('Deploying contract...', async (setStatus) => {
      const parsedCount = Number.parseInt(questionCount.trim(), 10);
      if (!Number.isFinite(parsedCount) || parsedCount <= 0) {
        throw new Error('Question count must be a positive number');
      }
      const result = await deploySurvey(session, question, BigInt(parsedCount));
      setContractAddress(result.contractAddress);
      setStatus('Waiting for preview indexer...');
      await pollForState(
        session.config.indexerUri,
        result.contractAddress,
        (attempt) => setStatus(`Waiting for preview indexer (attempt ${attempt})...`),
      );
    });
  }, [question, questionCount, session, withLoading]);

  const copyAddress = useCallback(async () => {
    if (!contractAddress) return;
    await navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [contractAddress]);

  const reset = useCallback(() => {
    setContractAddress('');
    setError('');
    setCopied(false);
  }, []);

  if (walletInstalled === false) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/5 px-8 py-14 text-center shadow-2xl shadow-black/20 backdrop-blur">
        <p className="mb-6 font-serif text-2xl text-white">Private Pulse</p>
        <p className="text-xs uppercase tracking-[0.32em] text-sky-200/70">1AM wallet required</p>
        <h2 className="mt-4 font-serif text-3xl text-[var(--foreground)]">Install 1AM first</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
          Browser extension only. Preview deploy flow lives in wallet, not on server.
        </p>
        <a
          href="https://1am.xyz"
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-slate-950 transition hover:translate-y-[-1px]"
        >
          Install 1AM
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-white/10 bg-[var(--panel)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-serif text-2xl text-white">Private Pulse</span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
              Midnight preview
            </span>
            <span className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100">
              1AM wallet only
            </span>
          </div>

          <h1 className="mt-6 max-w-xl font-serif text-5xl leading-[0.95] text-[var(--foreground)] sm:text-6xl">
            Launch a Private Pulse survey.
            <span className="block text-slate-300">One question. One contract. Reuse the address for feedback.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Set preview network first, connect 1AM, add your question, deploy in browser, and keep the returned
            address for the survey page.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Step 1</p>
              <p className="mt-2 text-sm text-slate-200">Connect 1AM on preview.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Step 2</p>
              <p className="mt-2 text-sm text-slate-200">Add the survey question.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Step 3</p>
              <p className="mt-2 text-sm text-slate-200">Paste the address on /survey.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[var(--panel-soft)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Deploy</p>
              <h2 className="mt-2 font-serif text-3xl text-[var(--foreground)]">Survey launch panel</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300">
              {TARGET_NETWORK_ID}
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Question</span>
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-[var(--foreground)] outline-none"
                placeholder="How was your experience?"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Question count</span>
              <input
                value={questionCount}
                onChange={(event) => setQuestionCount(event.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-[var(--foreground)] outline-none"
                placeholder="5"
                inputMode="numeric"
              />
            </label>
          </div>

          {!session ? (
            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <p className="text-sm leading-6 text-slate-300">
                Connect 1AM wallet first. Network is pinned to Preview before any wallet or contract call.
              </p>
              <button
                onClick={connectWallet}
                disabled={connecting}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-slate-950 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {connecting ? 'Connecting...' : 'Connect 1AM Wallet'}
              </button>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Wallet</p>
                <div className="mt-3 space-y-2 text-sm text-slate-200">
                  <p className="break-all">
                    <span className="text-slate-400">Unshielded: </span>
                    {truncateAddress(session.unshieldedAddress)}
                  </p>
                  <p>
                    <span className="text-slate-400">Network: </span>
                    {session.config.networkId}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDeploy}
                disabled={busy || !question.trim()}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-slate-950 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? statusMessage || 'Deploying...' : 'Deploy survey contract'}
              </button>

              {contractAddress && (
                <div className="mt-6 space-y-4 rounded-3xl border border-emerald-300/20 bg-emerald-400/8 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-200/70">Success</p>
                      <h3 className="mt-2 font-serif text-2xl text-[var(--foreground)]">Contract deployed</h3>
                    </div>
                    <button
                      onClick={copyAddress}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-200 transition hover:bg-black/30"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Address</p>
                    <p className="mt-2 break-all font-mono text-sm text-slate-100">{contractAddress}</p>
                  </div>

                  <p className="text-sm leading-6 text-slate-200">Use this address on the feedback page.</p>

                  <button
                    onClick={reset}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-black/20 px-4 text-sm text-slate-200 transition hover:bg-black/30"
                  >
                    Deploy another
                  </button>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="mt-6 rounded-3xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">
              {error}
            </div>
          )}

          <p className="mt-6 text-xs leading-5 text-slate-500">Wallet proving flow handles the deploy.</p>
        </section>
      </div>
    </div>
  );
}
