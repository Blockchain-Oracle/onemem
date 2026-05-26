# MemGPT (note on Letta relationship)

## Summary

**MemGPT and Letta are the same project, renamed.** The original MemGPT paper (UC Berkeley, arxiv 2310.08560) introduced the "LLM as operating system" pattern with self-editing memory, hierarchical memory, and context-window management. The open-source framework that grew around the paper was renamed **Letta** when the founding team incorporated; the original framework name (and the github repo `letta-ai/letta`, previously `cpacker/MemGPT`) was retained.

## Terminology, per the Letta team

- Use **"MemGPT"** to refer to:
  - The original research paper / design pattern (LLM with self-editing memory tools + context-window management).
  - The agent archetype.
- Use **"Letta"** to refer to:
  - The framework / company / product.
  - The open-source repository today.

## Status

- The Letta team continues to maintain the open-source repository.
- A legacy "MemGPT agents" mode still exists in Letta docs for backward compatibility.
- The research paper remains canonical for understanding the underlying technique.

## Coverage

Letta itself is **already covered in this research set** (separate folder: `02-inspirations/letta/`). This file exists to make explicit that any reference to "MemGPT" in a third-party doc refers to the same project — we don't need a separate competitive analysis.

## Sources

- https://www.letta.com/blog/memgpt-and-letta
- https://docs.letta.com/letta-memgpt
- https://docs.letta.com/concepts/letta/
- https://arxiv.org/abs/2310.08560 (original MemGPT paper)
- https://docs.letta.com/guides/legacy/memgpt_agents_legacy
