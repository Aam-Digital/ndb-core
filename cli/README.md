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

The `statistics` command requires Keycloak credentials (see below).
It supports `--format csv` for spreadsheet export — use `npm run --silent` to suppress npm's script header when redirecting to a file:

```bash
npm run --silent cli -- statistics --format csv > stats.csv
```

## Prerequisites

- Node.js 18+
- An ndb-core checkout
- `credentials.json` in the repo root (see below)

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

### Generating credentials.json on the server

Use [scripts/collect-credentials.sh](../ndb-setup/scripts/collect-credentials.sh) from the `ndb-setup` repo on the server, then copy the resulting `credentials.json` into the `cli/` directory.

The CLI looks for the file in this order (first match wins; the encrypted `.age` form is preferred over plaintext within each location):

1. `cli/credentials.json[.age]` — the default
2. `credentials.json[.age]` in the repo root — back-compat
3. `~/.config/ndb-cli/credentials.json[.age]` — opt-in, lives outside the repo so it can never be committed by accident

Or pass an explicit path with `--credentials <path>`.

## Protecting credentials (recommended)

`credentials.json` holds **production CouchDB admin passwords in plaintext**. Git-ignoring it
only keeps it out of commits — the file still sits unencrypted on disk. Encrypt it at rest with
[age](https://github.com/FiloSottile/age) so the secrets never live on disk in the clear.

Install age once:

```bash
sudo apt install age   # or: brew install age
```

Encrypt your `cli/credentials.json` with a passphrase, then securely delete the plaintext:

```bash
age -p -o cli/credentials.json.age cli/credentials.json
shred -u cli/credentials.json    # or: rm -P cli/credentials.json (macOS)
```

That's it. The CLI **prefers `credentials.json.age` over the plaintext file**, prompts you for the
passphrase, and decrypts it **into memory only** — no plaintext is ever written back to disk.

```console
$ npm run cli -- check
Enter passphrase: ******
...
```

To update the contents later, decrypt to a temp file, edit, re-encrypt, and shred the plaintext:

```bash
age -d cli/credentials.json.age > cli/credentials.json
# edit cli/credentials.json
age -p -o cli/credentials.json.age cli/credentials.json && shred -u cli/credentials.json
```

Both `credentials.json` and `credentials.json.age` are git-ignored (in `cli/` and the repo root).
The `.age` file is safe to share out-of-band (the passphrase is the only thing that decrypts it),
but is kept out of git by default — keep prod secrets out of the repo entirely. For extra safety
you can keep it fully outside the checkout at `~/.config/ndb-cli/credentials.json.age`.

> Non-interactive use (CI/cron) isn't supported with passphrase encryption: age reads the
> passphrase from the terminal and fails if none is available. Decrypt manually in those contexts.
