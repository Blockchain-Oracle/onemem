"""OneMem Python client — the entry point for verification.

    from onemem import OneMem

    with OneMem(network="testnet") as onemem:
        result = onemem.verify_session("0x08f4ef5b...")
        assert result.ok

v0.1 focuses on the off-chain verifier (read-only, no keystore). Write-path
PTBs (namespace/session creation) are mirrored from the TS SDK in a follow-up.
"""

from __future__ import annotations

from ._rpc import SuiRpc
from .generated.addresses import ACTIVE_NETWORK, OneMemAddresses, SuiNetwork, addresses_for
from .memory import MemoryClient
from .traces import VerifyResult, verify_session


class OneMem:
    """Read/verify client bound to a network's deployed OneMem package."""

    def __init__(
        self,
        *,
        network: SuiNetwork | None = None,
        rpc_url: str | None = None,
        addresses: OneMemAddresses | None = None,
        memory_namespace: str | None = None,
    ) -> None:
        self.network: SuiNetwork = network or ACTIVE_NETWORK
        self.addresses: OneMemAddresses = addresses or addresses_for(self.network)
        self.rpc = SuiRpc(rpc_url or self.addresses.rpc_url)
        self._memory_namespace = memory_namespace
        self._memory: MemoryClient | None = None

    @property
    def memory(self) -> MemoryClient:
        """Mem0-mirror add/search, shelling out to the ``onemem-memory`` bridge."""
        if self._memory is None:
            self._memory = MemoryClient(network=self.network, namespace=self._memory_namespace)
        return self._memory

    def verify_session(self, session_id: str) -> VerifyResult:
        """Off-chain Merkle verification of a trace session (see traces.verify_session)."""
        return verify_session(self.rpc, self.addresses.package_id, session_id)

    def close(self) -> None:
        self.rpc.close()

    def __enter__(self) -> OneMem:
        return self

    def __exit__(self, *_exc: object) -> None:
        self.close()
