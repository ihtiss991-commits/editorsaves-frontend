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


## Private real-sample validation

The research archive must remain outside GitHub because save data can contain personal progress, identifiers, and proprietary game state. After extracting the archive locally, run:

    npm run validate:real-samples -- path/to/Downloads

Pass the extracted archive folder containing a nested Downloads directory, or pass the Downloads directory itself. The runner reads the dedicated rpgmaker_mv and rpgmaker_mz folders, checks content-based detection, serializes and reparses each recognized file, and compares the complete JSON tree for exact data preservation. It also checks the optional rmmz_encrypted folder to confirm MZSEC1 wrappers are identified as unsupported rather than decoded.

The runner prints aggregate counts only. It does not print source filenames or save contents and does not write to the archive. A successful codec round-trip is not original-game acceptance testing; each game, plugin, and version still needs a load test in its actual game.

## Editor field-map limits

The shared editor schema exposes bounded standard fields only: party gold and steps; actor names, nicknames, levels, experience, HP/MP/TP; a bounded sample of inventory IDs and quantities; and bounded raw variable/switch IDs. Zero-valued numeric variables and both true/false switch states are represented. Raw IDs are deliberately not assigned guessed meanings. Plugin-specific properties remain preserved but read-only until a game-specific schema is validated.


## Unreal Engine GVAS beta

The separate /editor/unreal tool supports raw GVAS files with save-game header versions 2 and 3. It detects the legacy property-tag layout used before Unreal Engine 5.4 and the UE 5.4+ type-tree property layout. It reads the engine version, package versions, custom-version table, save class, and top-level tagged properties.

Editable scalar types are bounded to integer widths, 64-bit integer values (kept as decimal strings), float, double, boolean, and FString string properties. Arrays, maps, sets, structs, enum/name references, object references, native/binary properties and unknown payloads are preserved as raw bytes and shown read-only. Variable-length FString edits update the serialized property size. The rewritten file is reparsed and the edited scalar values are checked before download.

The editor runs in a dedicated browser worker, processes files locally, and keeps the source file unchanged. It does not infer game-specific meanings for property names or provide game-specific schemas. A structurally valid rewrite is not proof that a particular game accepts the save.

Header versions other than 2 and 3, custom-version formats other than 3, UE 5.4+ property extension tags, compressed/encrypted wrappers and game-specific container formats are not supported by this beta. The current research archive contains two raw GVAS files with non-2/3 save header versions; these are reported unsupported rather than guessed.

To validate against a private extracted research corpus, run:

    npm run validate:unreal-gvas -- path/to/Downloads

The command reads the unreal_gvas directory, checks supported property streams, confirms unchanged output is byte-exact, and tests a copy with one numeric scalar modified and reparsed. It prints aggregate counts only; original saves must not be committed to GitHub. Game acceptance still requires testing in each original game.
