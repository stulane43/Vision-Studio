# Deploying Vision Studio on your local network (Portainer)

This runs Vision Studio as a container on your LAN so you and your wife can each
sign in from any device and keep your visions separate. All data (accounts,
settings, projects) lives in a single Docker **volume** so it survives restarts
and updates.

---

## What you need
- A machine on your network running **Docker** + **Portainer** (e.g. a NAS, mini-PC, or always-on desktop).
- That machine's LAN IP (e.g. `192.168.1.50`). You'll reach the app at `http://<that-ip>:3100`.

---

## Option A — Portainer Stack from this Git repo (recommended)

Portainer builds the image for you from the `Dockerfile`.

1. Push this project to a git repo Portainer can reach (GitHub, Gitea, a local git server…).
2. In Portainer: **Stacks → Add stack**.
3. Name it `vision-studio`.
4. Build method: **Repository**.
   - **Repository URL**: your repo URL.
   - **Compose path**: `docker-compose.yml`.
5. (Optional) Under **Environment variables**, add `AIDLC_PROVIDER`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc. (all optional — each account can set its own key in-app).
6. **Deploy the stack.** First build takes a few minutes.
7. Open `http://<host-ip>:3100`, click **Create one**, and make your account.

To update later: **Pull and redeploy** the stack (Portainer re-builds from the latest commit). Your data volume is untouched.

---

## Option B — Build the image yourself, then deploy

Use this if you'd rather not point Portainer at a git repo.

1. On the Docker host (or any machine, then transfer the image):
   ```sh
   docker build -t vision-studio:latest .
   ```
   To move an image built elsewhere: `docker save vision-studio:latest | gzip > vs.tar.gz`, copy it over, then `docker load < vs.tar.gz`.
2. In Portainer: **Stacks → Add stack → Web editor**, paste the contents of `docker-compose.yml`, but **remove the `build: .` line** (the image already exists).
3. **Deploy the stack**, then open `http://<host-ip>:3100`.

---

## Plain `docker compose` (no Portainer)
```sh
docker compose up -d --build
# app at http://<host-ip>:3100 ; logs: docker compose logs -f
```

---

## Data & backups
- Everything persists in the **`vision-data`** volume, mounted at `/data` in the container:
  - `/data/.aidlc/users.json`, `sessions.json`, `settings/<user>.json`
  - `/data/projects/<user-id>/…`
- Back it up by backing up that volume (Portainer can browse/snapshot volumes).
- Removing the **stack** keeps the volume; removing the **volume** erases all accounts and visions.

## Accounts
- Sign-up is open to anyone who can reach the app on your LAN — fine for a home network. You and your wife each create an account; visions are isolated per account.

## HTTPS (optional, recommended if exposed beyond your LAN)
- By default the app serves plain HTTP and `AIDLC_HTTPS=false` (so the login cookie works over `http://`).
- If you put it behind a reverse proxy with TLS (Caddy, Nginx Proxy Manager, Traefik), set `AIDLC_HTTPS=true` in the stack env to enable **Secure cookies + HSTS**.
- ⚠️ If you set `AIDLC_HTTPS=true` but access over plain HTTP, the browser won't send the session cookie and **sign-in will appear to silently fail** — keep it `false` for HTTP.

## Troubleshooting
- **Can't reach it from another device?** Check the host firewall allows port `3100`, and you're using the host's LAN IP (not `localhost`).
- **Login does nothing / bounces back to the login page?** You're on HTTP with `AIDLC_HTTPS=true`. Set it to `false` and redeploy.
- **Want real AI, not Mock?** Each account opens **⚙ Settings** and adds an Anthropic or OpenAI key (or set a shared key via the stack env).
