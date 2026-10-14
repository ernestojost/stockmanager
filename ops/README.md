# Live demo deployment

The demo at **https://stockmanager.reddevs.net** runs on a shared Debian VPS:

| Piece    | Where |
|----------|-------|
| SPA      | `/var/www/stockmanager.reddevs.net` (static `frontend/dist`, served by nginx) |
| API      | `/opt/stockmanager/api`, pm2 process `stockmanager-api` on `127.0.0.1:4325` |
| Database | MariaDB 10.3, database/user `admin_stockmanager` (created from the Vesta panel) |
| nginx    | `/etc/nginx/conf.d/stockmanager.conf` ([`nginx-stockmanager.conf`](nginx-stockmanager.conf)) — `/api/` is proxied to the API, everything else falls back to `index.html` |
| TLS      | Cloudflare proxy in front; origin cert from Let's Encrypt via `acme.sh` (webroot `/var/www/stockmanager-acme`, auto-renewed) |

The frontend is built with `VITE_API_URL=/api`, so the browser talks to the API on the same origin.

## Re-deploy

```bash
bash ops/deploy.sh
```

Builds the SPA locally, uploads the committed backend, keeps the server's `.env` and `node_modules`, restarts pm2 and checks `/api/health`.

## First-time setup (reference)

1. DNS: proxied `A` record `stockmanager` → VPS IP in Cloudflare.
2. Database: `v-add-database admin stockmanager stockmanager '<password>' mysql`.
3. `/opt/stockmanager/api/.env` with `PORT=4325`, the DB credentials, a random `JWT_SECRET` and `CORS_ORIGIN=https://stockmanager.reddevs.net`.
4. nginx: an HTTP-only server block for the ACME webroot, then
   `acme.sh --issue -d stockmanager.reddevs.net -w /var/www/stockmanager-acme` and `acme.sh --install-cert ... --reloadcmd "systemctl reload nginx"`, then the full vhost.
5. `bash ops/deploy.sh`, then load the schema and sample data (the `CREATE DATABASE`/`USE` lines are stripped because the server database has another name):

   ```bash
   cd /opt/stockmanager/api/src/db
   cat schema.sql seed.sql | sed -E '/^CREATE DATABASE/,/;/d; /^USE /d' \
     | mysql -u admin_stockmanager -p admin_stockmanager
   ```
