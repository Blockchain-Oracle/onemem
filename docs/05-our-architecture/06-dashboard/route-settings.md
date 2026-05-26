# Route: `/settings` — Dashboard

User settings: delegate keys, providers, runtimes, account.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Sidebar │ Topbar                                                      │
├─────────┼────────────────────────────────────────────────────────────┤
│         │  Settings                                                   │
│         │                                                             │
│         │  Tabs: [Account] [Delegate keys] [Runtimes]                 │
│         │        [Providers] [Notifications] [Advanced]               │
│         │                                                             │
│         │  Account                                                    │
│         │  ─────────                                                  │
│         │  Sui address:    0xowner...                                 │
│         │  MemWalAccount:  0xacc... ↗ Suiscan                         │
│         │  Active namespace: "personal" (0xnamespace...)              │
│         │    [Change active namespace ▾]                              │
│         │                                                             │
│         │  Network:        mainnet                                    │
│         │  Relayer:        https://relayer.memwal.ai                  │
│         │                                                             │
│         │  ─────────                                                  │
│         │                                                             │
│         │  Delegate keys                                              │
│         │  ─────────                                                  │
│         │  These keys let your CLI + plugins write memories on your   │
│         │  behalf without re-signing each time. Each key has a TTL.   │
│         │                                                             │
│         │  ┌──────────────────────────────────────────────────────┐  │
│         │  │ Label          Pubkey  Created    Expires   Status   │  │
│         │  ├──────────────────────────────────────────────────────┤  │
│         │  │ CLI default    0xab...  Today    in 30d     Active   │  │
│         │  │ Claude Code    0xcd...  Today    in 30d     Active   │  │
│         │  │ Old laptop     0xef...  May 1     Expired   Inactive │  │
│         │  └──────────────────────────────────────────────────────┘  │
│         │                                                             │
│         │  [+ Generate new delegate key]                              │
│         │  [Revoke selected]                                          │
│         │                                                             │
│         │  Limit: 20 delegate keys per MemWalAccount (MemWal default) │
│         │                                                             │
└─────────┴────────────────────────────────────────────────────────────┘
```

---

## Tabs

### Account
- Sui address (read-only)
- MemWalAccount ID with Suiscan link
- Active namespace selector (dropdown)
- Network selector (mainnet/testnet/devnet — defaults to mainnet)
- Relayer URL (advanced — usually unchanged)

### Delegate keys
- Per-key table: label, pubkey (truncated), created, expires, status
- Generate new key (writes to chain via `MemWalAccount::add_delegate_key`)
- Revoke selected (writes to chain via `MemWalAccount::remove_delegate_key`)
- Max 20 keys per MemWal account (MemWal-imposed limit)

### Runtimes
- Cross-link to `/apps` page (this is the same content; duplicated here for discoverability)

### Providers
- Active framework providers detected (if any)
- Quick-install snippets per framework (Vercel AI SDK, OpenAI Agents, CrewAI, LiveKit, ElevenLabs)

### Notifications
- Email on verify failure (hosted only; v0.2)
- Telegram bot integration (v0.2 stretch — lifted from claude-mem's `TelegramNotifier`)
- Webhook URL (v0.2)

### Advanced
- Auto-recall threshold (default 0.3)
- Auto-capture toggle (master switch)
- Auto-trace toggle (master switch)
- Compression LLM (Anthropic Haiku 4.5 / Sonnet / Opus / Gemini / OpenAI)
- Embedding model (relayer-managed by default; advanced users can override)
- Export format default (JSON / SARIF)
- Dark mode (system / light / dark — toggle saved to localStorage)

---

## Components

| Component | Purpose |
|---|---|
| `<SettingsTabs>` | Tab nav (Radix Tabs primitive) |
| `<AccountSettings>` | Sui address + MemWalAccount info |
| `<NamespaceSelector>` | Dropdown with all namespaces user owns/has access to |
| `<DelegateKeyTable>` | List + generate + revoke delegate keys |
| `<ProviderInstaller>` | Per-framework install snippets |
| `<NotificationSettings>` | Email/Telegram/webhook config (v0.2) |
| `<AdvancedSettings>` | Power-user knobs |
| `<DangerZone>` | Bottom of settings — destructive actions (delete account, factory reset, etc) |

---

## Settings persistence

- Local mode: settings persist to `~/.onemem/settings.json`
- Hosted mode: settings persist to user's MemWalAccount metadata (on-chain dynamic field) for cross-device sync
- Some settings (like `dark_mode`) are device-specific and always in localStorage

---

## Cross-references

- `ui-architecture.md`
- `route-apps.md` — duplicate runtime view
- `../05-cli/login-flow.md` — delegate key lifecycle
- `../02-sdks/shared-api-surface.md` — account/namespace methods
- `../../02-inspirations/memwal-incubation/README.md` — MemWal's 20-key limit + delegate-key model
