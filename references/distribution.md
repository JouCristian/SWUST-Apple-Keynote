# Public distribution contract

The repository is directly installable as `.agents/skills/swust-apple-keynote`. Packaging always emits the canonical top-level `swust-apple-keynote/`, regardless of checkout directory name. Only the public slim profile is supported; no historical/private examples or QA archive profile is exposed.

```sh
python -B scripts/package.py ../swust-apple-keynote-v1.0.0-slim.zip --slim
python -B scripts/verify-distribution.py ../swust-apple-keynote-v1.0.0-slim.zip --modules node_modules --report qa/archive-verification.json
```

The explicit policy includes source, four offline builds, documentation, screenshots, audit and release notes. It excludes `.git`, caches, node_modules, raw QA, ZIPs and local state. Staging does not mutate originals. Privacy findings block packaging; staged inventory and package manifest bind every distributed byte except their declared self references. Missing public documentation links are errors, not silently removed references. The ZIP receipt reports actual bytes, file count, CRC and SHA256.

The verifier extracts actual bytes into an isolated `.agents/skills/swust-apple-keynote`, checks exact membership/hash/cache/privacy, runs Skill resource validation and all builds, scaffolds a new sensor topic, and runs its offline browser gate. REVIEW stays REVIEW. Regenerate `qa/scaffold/` for current-runtime acceptance; generated QA remains ignored. The public `audit/file-manifest.json` lists repository source/build/screenshot files, excluding itself to avoid a hash cycle. Recreate it after final edits. No script creates a remote repository, pushes or publishes a Release.
