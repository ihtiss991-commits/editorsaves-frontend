# Save Engine — Initial Format Support

This document records the first parser/serializer milestone. It is an engineering status document, not a public compatibility promise.

## Implemented codecs

| Format family | Container codec | Status |
| --- | --- | --- |
| RPG Maker MV | LZ-String compressed Base64 | Implemented in the development library |
| RPG Maker MZ | zlib/DEFLATE with UTF-8 byte-string transport | Implemented in the development library |
| RPG Maker MZ raw zlib | zlib/DEFLATE binary input compatibility | Read support |

Detection validates both the container codec and the decoded JSON structure. A filename extension is only a hint and is not sufficient evidence of compatibility.

## Data preservation

The parser returns the decoded JSON tree without stripping unknown properties. This preserves game-specific and plugin-added fields. The serializer accepts the modified data tree and encodes it using the selected format adapter.

The current JSON representation does not instantiate RPG Maker runtime classes. It preserves serialized properties and metadata as data. No scripts, plugins, constructors, or executable payloads are evaluated.

## Explicit limitations

- The MZSEC1 custom-encryption wrapper found in the research archive is identified but not decrypted.
- This codec layer does not yet provide game-specific editable-field schemas.
- A successful parse does not establish that a particular game's modified save will load.
- Re-serialization is tested for semantic round-tripping; compressed output is not expected to be byte-identical to the original.
- Before public UI integration, decoding must run inside a dedicated Web Worker with a termination timeout. Output-size limits are applied, but LZ-String decompression itself is synchronous.
- Actual game acceptance testing is required before claiming compatibility for any individual title.

## Tests

Run the focused codec test suite with:

    npm run test:save-engine

The synthetic test suite covers MV and MZ round trips, nested plugin fields, global save metadata, content-based detection, unsupported encryption, malformed inputs, and decompressed-size limits.

## Research corpus

The uploaded research archive remains outside the public repository. It is not committed as test data because save files may contain personal identifiers, game progress, or proprietary content. Tests use synthetic examples instead.
