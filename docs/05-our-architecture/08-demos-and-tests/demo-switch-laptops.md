# Demo: Switch Laptops Mid-Project

**Wedge moment:** memory follows you across machines + runtimes. The "Walrus is the network" demo.

**Duration:** ~90 seconds.

---

## Story

Abu is working on a project on Laptop A using Claude Code with OneMem. Mid-project, he switches to Laptop B (running Hermes Agent + OneMem). His memory comes with him — no manual sync, no SaaS account login, no export-import dance.

---

## Script

```
[0:00 — Laptop A, Claude Code session in foreground]
Narrator: "I'm working on a Next.js project in Claude Code. OneMem is active."

[0:05 — Abu tells Claude]
Abu: "Remember that this project uses pnpm, the auth library is Clerk, and the
      database is Postgres on Supabase."

[0:12 — Claude responds; OneMem auto-captures the memory]
[Dashboard popup shows: "Memory saved: project setup. Walrus blob 0xabc..."]

[0:20 — Cut to Laptop B, Hermes Agent terminal]
Narrator: "Now I switch to my other machine. Hermes Agent. Different runtime."

[0:25 — Abu starts Hermes]
Abu: "$ hermes chat"
[Hermes greets; OneMem provider activates]

Abu: "What database does the Next.js project use?"

[0:35 — Hermes responds using memory from Claude Code]
Hermes: "Based on prior context, the project uses Postgres on Supabase. The auth
         library is Clerk. The package manager is pnpm."

Narrator: "The memory was on Walrus. Hermes read it via the OneMem provider.
           No vendor account. No manual sync. Just Walrus."

[0:50 — Open dashboard]
Abu: "$ onemem dashboard"
[Browser opens; /trace shows TWO trace sessions in the SAME namespace:
   - Claude Code session (Laptop A)
   - Hermes session (Laptop B)
 Both verifiable; both share the same MemoryNamespace]

[1:05 — Verify drawer]
Abu clicks "Verify all". Drawer slides up. Chain walks. Page glows chartreuse.

Narrator: "Cross-runtime. Cross-device. Cryptographically provable.
           Built on Walrus + Sui + Seal + MemWal."

[1:25 — Demo card with brand + URL]
"OneMem · onemem.ai"
[End]
```

---

## Reproducibility

```bash
# Laptop A
$ npm install -g @onemem/cli @onemem/dashboard
$ /plugin install onemem  # in Claude Code
$ onemem login            # browser sign-in
$ onemem init --name research-project --kind USER

# Use Claude Code; OneMem captures everything

# Laptop B
$ pip install hermes-onemem onemem-cli
$ onemem login            # same Google account → same Sui address → same MemWalAccount
$ onemem set-namespace 0x<namespace-id-from-Laptop-A>
$ export ONEMEM_DELEGATE_KEY=...
$ export ONEMEM_ACCOUNT_ID=0x...
$ export ONEMEM_NAMESPACE_ID=0x...
$ hermes config set memory.provider onemem
$ hermes chat
```

Same Sui address (via Enoki Google flow) = same MemWalAccount = same namespaces accessible. Or, alternatively, share the namespace explicitly via Sui capability transfer.

---

## What's exercised

- Pillar 1: MemoryNamespace shared across two sessions
- Pillar 2: SDK on both TS (Claude Code plugin) and Python (Hermes plugin)
- Pillar 3: Claude Code native plugin + Hermes native plugin
- Pillar 7: Dashboard rendering cross-runtime sessions
- Walrus: encrypted blobs persist + are fetchable from anywhere
- Seal: same delegate key decrypts on both machines
- Sui: same MemoryNamespace owned by same address

---

## Video frame thumbnail

The frozen frame for the YouTube thumbnail: Laptop A side-by-side with Laptop B, both showing the dashboard, both with the chartreuse "Verified" badge. Tagline overlay: "Memory follows you."

---

## Failure modes (to test before recording)

- MemWal relayer downtime during recording → use staging relayer + dry-run
- Sui mainnet RPC slowness → record with cached state where possible
- Browser auto-fill incorrect credentials → use a clean profile for recording
- Hermes startup latency → pre-warm before recording

---

## Cross-references

- `README.md` — demo matrix
- `../03-runtimes/claude-code-plugin.md` — Claude Code plugin spec
- `../03-runtimes/hermes-plugin.md` — Hermes plugin spec
- `../06-dashboard/route-trace.md` — `/trace/[id]` view + Verify drawer
- `../00-goal/GOAL.md` — vision: "memory follows you"
