// Version-as-dynamic-field upgrade pattern, lifted from MemWal's account.move.
// Spec: docs/05-our-architecture/01-protocol/upgrade-pattern.md
// Skeleton; implemented in Pillar 1.
module onemem::version;

const CURRENT_VERSION: u64 = 1;

public fun current_version(): u64 {
    CURRENT_VERSION
}
