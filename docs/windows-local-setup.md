# WMC NEXUS on Windows (without Docker)

Türkçe yönerge: [Windows kurulumu (Türkçe)](windows-local-setup.tr.md).

This source build runs the web UI and Go backend locally. PostgreSQL remains a required service;
Docker is not required.

## Requirements

- Windows 10 or 11
- Go 1.26.10 or newer
- Node.js 22 or newer (npm is included)
- A locally running PostgreSQL 16 instance and an empty database/user for WMC NEXUS

The database schema uses PostgreSQL-specific features. SQLite is used for local traffic indexing,
not as a replacement for the main PostgreSQL database.

## Build and run

1. Install PostgreSQL and create a database and login role for the application. Keep the password
   private; do not put it in this repository.
2. Open PowerShell in the project directory.
3. Run:

   ```powershell
   .\install-windows.ps1
   ```

   The script installs frontend dependencies from the lockfile, builds the static UI and Windows
   executable, then securely prompts for the PostgreSQL DSN. It does not install PostgreSQL or
   write the DSN to a project file.

   To build without starting the application, run:

   ```powershell
   .\install-windows.ps1 -BuildOnly
   ```

4. On first startup, copy the one-time setup token from the console and open
   `http://127.0.0.1:8787` in a browser. The service binds to loopback by default.

For a local database, the DSN generally has this form:

```text
postgres://USERNAME:PASSWORD@127.0.0.1:5432/DATABASE?sslmode=disable
```

URL-encode special characters in the username or password. If `ARTEX_PG_DSN` is already set in
the current PowerShell session, the script reuses it and does not prompt.

## Data and license

Application data and generated keys are stored next to the executable under the project data/key
directories. Back them up before moving or replacing the build. The project is derived from ARTEX;
retain the upstream license and notices when redistributing it.
