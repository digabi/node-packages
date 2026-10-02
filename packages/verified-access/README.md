# Verified Access protocol

Shared runtime schemas and inferred TypeScript types for the KTP ↔ sa-yo
Verified Access observation endpoints. The contract is version 1 and deliberately
does not grant admission or claim that two attestations came from the same device.

Includes start context, issued challenges, completion payload, observation and
the base64 length limit. KTP session status, sa-yo storage/provider interfaces,
Google credentials and protobuf handling remain in their owning services.

Run `npm run test --workspace=@digabi/verified-access` from the repository root.
