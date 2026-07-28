# ndb-core CLI

Admin CLI for Aam Digital operators. Runs locally against a `credentials.json` file — no deployed service required.

## Commands

Use `--help` at any level to see all options:

```bash
npm run cli -- --help
npm run cli -- migrate --help
npm run cli -- migrate run --help
```

| Command                          | Description                                   |
| -------------------------------- | --------------------------------------------- |
| `check`                          | Verify connectivity to all (or selected) orgs |
| `migrate list`                   | List all available migrations                 |
| `migrate run <id>`               | Run a migration (preview → confirm → apply)   |
| `couchdb search <regex>`         | Find entity documents matching a regex        |
| `couchdb edit <regex> <replace>` | Regex replace inside entity documents         |
| `couchdb conflicts`              | List conflicted documents                     |
| `statistics`                     | Print entity and user counts per org          |
| `credentials merge <file>`       | Merge a server-collected credentials.json in  |

The `statistics` command requires Keycloak credentials (see below).
It supports `--format csv` for spreadsheet export — use `npm run --silent` to suppress npm's script header when redirecting to a file:

```bash
npm run --silent cli -- statistics --format csv > stats.csv
```

## Prerequisites

- An ndb-core checkout
- `cli/credentials.json` in your checkout (see below; repo root is also supported as a fallback)

## Quick start

```bash
npm install
npm run cli -- --help
```

## credentials.json

Place a `credentials.json` in the `cli/` folder of your ndb-core checkout (it is git-ignored).

```json
{
  "orgs": [
    { "name": "myorg", "password": "secret" },
    {
      "name": "another",
      "url": "custom.host.example.com",
      "password": "secret2",
      "category": "prod"
    }
  ],
  "keycloak": {
    "url": "https://keycloak.aam-digital.com",
    "adminPassword": "kc-admin-password"
  }
}
```

Org fields:

| Field      | Required | Description                                        |
| ---------- | -------- | -------------------------------------------------- |
| `name`     | yes      | Short org name, e.g. `c-myorg`                     |
| `password` | yes      | CouchDB admin password                             |
| `url`      | no       | Override host (default: `<name>.<DOMAIN env var>`) |
| `username` | no       | CouchDB admin username (default: `admin`)          |
| `category` | no       | Used with `--category` to filter org subsets       |

If `url` is omitted, the CLI builds it as `<name>.<DOMAIN>` where `DOMAIN` is read from the environment.

The `keycloak` block is required by the `statistics` command. As a fallback, set `KEYCLOAK_URL` and `KEYCLOAK_ADMIN_PASSWORD` env vars instead.

Env vars (`DOMAIN`, `KEYCLOAK_URL`, `KEYCLOAK_ADMIN_PASSWORD`, `NEW_USERNAME`) can be set in the
shell, or dropped into a `cli/.env` file (`KEY=value` per line, git-ignored) — the CLI loads it
automatically on startup. A value already exported in the shell takes precedence over `.env`.

### Generating credentials.json on the server

Use [scripts/collect-credentials.sh](../ndb-setup/scripts/collect-credentials.sh) from the `ndb-setup` repo on the server, then copy the resulting `credentials.json` into the `cli/` directory.

If you already have a credentials file, don't replace it — run [`credentials merge`](#merging-new-credentials-into-your-existing-file) instead, so your local additions survive.

The CLI looks for the file in this order (first match wins; the encrypted `.age` form is preferred over plaintext within each location):

1. `cli/credentials.json[.age]` — the default
2. `credentials.json[.age]` in the repo root — back-compat
3. `~/.config/ndb-cli/credentials.json[.age]` — opt-in, lives outside the repo so it can never be committed by accident

Or pass an explicit path with `--credentials <path>`.

### Merging new credentials into your existing file

Once you already have a (typically encrypted) credentials file, don't overwrite it with a freshly
collected one — that would throw away your `category` labels, custom `url`/`username` overrides and
the `keycloak` block, none of which the server-side script knows about. Merge instead:

```bash
npm run cli -- credentials merge ~/Downloads/credentials.json
```

The collection script only reports `name` and `password`, so the merge asks for the optional fields
of each **newly added** org (existing orgs are never re-asked):

| Question   | Default           | Notes                                                                  |
| ---------- | ----------------- | ---------------------------------------------------------------------- |
| `category` | none              | The values already in use are shown as a hint                          |
| `username` | `admin`           | CouchDB admin user — override with `--new-username` or `$NEW_USERNAME` |
| `url`      | `<name>.<DOMAIN>` | Required if `DOMAIN` is unset — see below                              |

Merge rules:

- Orgs are matched by `name`, ignoring a leading `c-` (the collection script strips the instance
  prefix, so local `c-myorg` still matches an incoming `myorg`), then by `url`. Matched orgs keep the
  spelling and all extra fields already in your file — only the values the source file actually
  provides (in practice: the password) are overwritten.
- Orgs only in the source file are appended.
- Orgs only in your file are **kept** and listed as `not in source`; pass `--prune` to drop them.
- `keycloak` and any other top-level keys are preserved.

The file you copied off the server is a plaintext list of production admin passwords, so it is
**shredded once the merge has been written** — that is the `shred -u` step you would otherwise have
to remember. It is only ever removed after a confirmed, successful write: `--dry-run`, declining the
confirmation, a failed re-encryption, or an "already up to date" run all leave it alone. Pass
`--keep-source` to keep it regardless.

If no credentials file exists yet, this same command creates one from the source file.

## Protecting credentials (recommended)

`credentials.json` holds **production CouchDB admin passwords in plaintext**. Git-ignoring it
only keeps it out of commits — the file still sits unencrypted on disk. Encrypt it at rest with a
passphrase (the [age](https://github.com/FiloSottile/age) format) so the secrets never live on disk
in the clear.

The CLI encrypts and decrypts `.age` files itself — no external tool needed. Bootstrap the encrypted
file from your plaintext one, then let the merge shred the plaintext once it's written:

```bash
npm run cli -- credentials merge cli/credentials.json --credentials cli/credentials.json.age
```

Confirm the write it proposes (this is also the prompt that names shredding your plaintext file),
then enter a new passphrase twice — `credentials.json.age` doesn't exist yet, so there's nothing to
reuse. That's it. The CLI **prefers `credentials.json.age` over the plaintext file**, prompts you for
the passphrase, and decrypts it **into memory only** — no plaintext is ever written back to disk.

```console
$ npm run cli -- check
Enter passphrase: ******
...
```

To add newly collected credentials later, use `credentials merge` (without `--credentials`, so it
finds the existing `.age` file). It never writes the decrypted contents to disk, so there is no
plaintext to shred afterwards, and by default it **reuses the passphrase** it already asked for when
reading the file — you're only asked once per run, even though the target is both read and rewritten.
Pass `--new-passphrase` to rotate it instead.

Both `credentials.json` and `credentials.json.age` are git-ignored (in `cli/` and the repo root).
The `.age` file is safe to share out-of-band (the passphrase is the only thing that decrypts it),
but is kept out of git by default — keep prod secrets out of the repo entirely. For extra safety
you can keep it fully outside the checkout at `~/.config/ndb-cli/credentials.json.age`.

> Non-interactive use (CI/cron) isn't supported: passphrase entry is interactive-only. Decrypt
> manually and use the plaintext temporarily in those contexts.
