# DSPy (memory primitives — partial)

## What it is

DSPy is Stanford NLP's framework for **programming, not prompting** LLMs. Programs are composed of **Signatures** (declarative input/output specs) and **Modules** (composable components with learnable parameters — the prompt pieces and LM weights). The compiler optimizes the program against a dataset and metric.

DSPy is **not primarily a memory framework**. It exposes lightweight memory-adjacent primitives, but persistent long-term memory is not the focus.

## Memory-adjacent primitives in DSPy

1. **Module state.** `dspy.Module` is the base class; it manages state across calls but does not persist by default.
2. **Retry / dspy.Retry** — wraps any module and re-invokes it with error feedback, providing short-term *trace* memory across attempts.
3. **Caching** — DSPy supports in-memory or on-disk caches via `litellm` for cached LM responses. This is operational caching, not agent memory.
4. **Retrieval modules** — `dspy.Retrieve` and adapters for vector backends (ColBERT, Pinecone, etc.) treat retrieval as a typed module. Closest thing DSPy has to a memory abstraction.

## What's missing

- No semantic / episodic / procedural taxonomy
- No managed long-term store
- No session-spanning memory primitive
- No write-once-read-many memory abstraction
- No MCP server

## API surface

- Python SDK only.
- Signature + Module + Optimizer (BootstrapFewShot, MIPRO, etc.).
- `dspy.Retrieve` for retrieval-augmented modules.

## Integration model

- Pure Python library.
- **No memory backend bundled.** You bring your own retriever / vector DB.
- DSPy programs can be wrapped as agents, but persistent memory is an external concern.

## What we'd borrow for OneMem

- **Signatures as a typed write API.** DSPy's Signature is a clean way to declare "this input produces this output." OneMem's typed Move writes could be wrapped in a DSPy-like Signature so memory schema is part of the program spec, not an afterthought.
- **`dspy.Retrieve` as the interface to plug OneMem into.** If we build a `dspy.OneMemRetrieve` module, every DSPy program gets verifiable memory for free. Small surface; high leverage.
- **Compile-time vs runtime distinction.** DSPy compiles programs against datasets. An "OneMem-aware DSPy program" could compile a memory access policy (what to anchor, what to skip) the same way DSPy compiles prompts. Speculative but interesting.
- **Net:** DSPy is a tangential integration target, not an inspiration for the core architecture. Worth a small adapter; not worth deep modeling against.

## Sources

- https://dspy.ai/
- https://github.com/stanfordnlp/dspy
- https://github.com/stanfordnlp/dspy/blob/main/docs/docs/learn/programming/modules.md
- https://github.com/stanfordnlp/dspy/blob/main/dspy/primitives/module.py
- https://deepwiki.com/stanfordnlp/dspy
- https://deepwiki.com/stanfordnlp/dspy/2.2-signatures-and-functional-programming
