// /verify/[session_id] — PUBLIC chain verifier (no login). Implemented in Pillar 6.
// Spec: docs/05-our-architecture/06-dashboard/route-verify-public.md
// Anyone in the world can paste a session ID and verify the Merkle chain integrity without an account.

type Params = { session_id: string };

export default async function PublicVerifyPage({ params }: { params: Promise<Params> }) {
  const { session_id } = await params;
  return (
    <main>
      <h1>OneMem verification</h1>
      <p>Session: {session_id}</p>
      <p>(Public verify skeleton — implementation lands in Pillar 6)</p>
    </main>
  );
}
