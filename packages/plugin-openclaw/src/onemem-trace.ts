// OneMem trace recorder for the OpenClaw plugin.
//
// An OpenClaw plugin runs in one long-lived process, so per-session trace state
// lives in an in-memory map (no cross-process file needed, unlike the Claude
// Code hooks). Defensive throughout: a OneMem failure must never break the
// agent, so callers swallow errors.

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

import { CallStatus, OneMem, SessionStatus } from "@onemem/sdk-ts";

export interface TraceConfig {
  namespaceId: string;
  rwCapId: string;
  network: "testnet" | "mainnet" | "devnet" | "local";
  privateKey?: string;
}

/** OneMem config from env, or null (plugin then records nothing). */
export function loadConfig(): TraceConfig | null {
  const namespaceId = process.env.ONEMEM_NAMESPACE_ID;
  const rwCapId = process.env.ONEMEM_RW_CAP_ID;
  if (!namespaceId || !rwCapId) return null;
  return {
    namespaceId,
    rwCapId,
    network: (process.env.SUI_NETWORK as TraceConfig["network"]) ?? "testnet",
    privateKey: process.env.ONEMEM_PRIVATE_KEY,
  };
}

function loadSigner(privateKey?: string): Ed25519Keypair {
  if (privateKey) return Ed25519Keypair.fromSecretKey(privateKey);
  const path = join(homedir(), ".sui", "sui_config", "sui.keystore");
  const entries = JSON.parse(readFileSync(path, "utf8")) as string[];
  return Ed25519Keypair.fromSecretKey(Buffer.from(entries[0]!, "base64").subarray(1));
}

interface BufferedCall {
  toolName: string;
  input: unknown;
  output: unknown;
}

interface SessionEntry {
  onememSessionId: string;
  calls: BufferedCall[];
}

/**
 * Records OpenClaw agent activity as a verifiable OneMem trace: open a session
 * per agent run, buffer tool calls, flush them as Merkle-chained ActionCalls at
 * the end. One recorder instance per plugin process.
 */
export class TraceRecorder {
  private client: OneMem | null = null;
  private readonly sessions = new Map<string, SessionEntry>();

  constructor(private readonly config: TraceConfig) {}

  private async getClient(): Promise<OneMem> {
    if (!this.client) {
      this.client = await OneMem.create({
        network: this.config.network,
        signer: loadSigner(this.config.privateKey),
      });
    }
    return this.client;
  }

  /** agent_start → open a OneMem TraceSession for this agent run. */
  async start(sessionKey: string): Promise<void> {
    try {
      if (this.sessions.has(sessionKey)) return;
      const onemem = await this.getClient();
      const session = await onemem.traces.startSession({
        namespaceId: this.config.namespaceId,
        rwCapId: this.config.rwCapId,
        agentId: "openclaw",
        environment: "openclaw",
        sdkVersion: "0.1.0",
      });
      this.sessions.set(sessionKey, { onememSessionId: session.sessionId, calls: [] });
    } catch {
      // never break the agent
    }
  }

  /** tool_execution_end → buffer the tool call (flushed on agent_end). */
  record(sessionKey: string, call: BufferedCall): void {
    this.sessions.get(sessionKey)?.calls.push(call);
  }

  /** agent_end → flush buffered calls as ActionCalls + close the session. */
  async end(sessionKey: string): Promise<string | null> {
    const entry = this.sessions.get(sessionKey);
    if (!entry) return null;
    this.sessions.delete(sessionKey);
    try {
      const onemem = await this.getClient();
      const enc = (v: unknown) =>
        new TextEncoder().encode(typeof v === "string" ? v : JSON.stringify(v ?? ""));
      let parentCallId: string | null = null;
      for (const call of entry.calls) {
        const emitted = await onemem.traces.appendCall({
          sessionId: entry.onememSessionId,
          namespaceId: this.config.namespaceId,
          rwCapId: this.config.rwCapId,
          parentCallId,
          toolName: call.toolName,
          toolNamespace: "openclaw",
          inputContent: enc(call.input),
          encrypt: true,
        });
        await onemem.traces.closeCall({
          sessionId: entry.onememSessionId,
          rwCapId: this.config.rwCapId,
          namespaceId: this.config.namespaceId,
          callId: emitted.callId,
          outputContent: enc(call.output),
          encrypt: true,
          status: CallStatus.Success,
        });
        parentCallId = emitted.callId;
      }
      await onemem.traces.endSession({
        sessionId: entry.onememSessionId,
        rwCapId: this.config.rwCapId,
        status: SessionStatus.Completed,
      });
      return entry.onememSessionId;
    } catch {
      return null;
    }
  }
}
