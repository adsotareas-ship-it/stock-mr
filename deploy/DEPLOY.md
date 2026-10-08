# Despliegue en VPS (Ubuntu/Debian + Nginx + PM2 + Postgres)

Reemplaza `TU_DOMINIO` por tu dominio. El DNS (registro A) debe apuntar a la IP del VPS.

## 1. Paquetes base
```bash
sudo apt update && sudo apt install -y nginx postgresql git certbot python3-certbot-nginx
# Node 20+ (si `node -v` es menor):
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm i -g pm2
```

## 2. Postgres
```bash
sudo -u postgres psql -c "CREATE USER stockmr WITH PASSWORD 'CAMBIA_ESTA_CLAVE';"
sudo -u postgres psql -c "CREATE DATABASE stockmr OWNER stockmr;"
```
Las tablas se crean solas en el primer arranque.

## 3. Código y build
```bash
sudo mkdir -p /var/www && sudo chown $USER /var/www
git clone <URL_DE_TU_REPO> /var/www/stock-mr && cd /var/www/stock-mr
cp .env.example .env && nano .env     # JWT_SECRET (largo y aleatorio) y DATABASE_URL
npm ci && npm run build
```

## 4. Arrancar con PM2
```bash
pm2 start deploy/ecosystem.config.cjs && pm2 save && pm2 startup   # ejecuta el comando que imprime
```

## 5. Nginx + HTTPS
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/stock-mr
sudo sed -i 's/TU_DOMINIO/tudominio.com/' /etc/nginx/sites-available/stock-mr
sudo ln -s /etc/nginx/sites-available/stock-mr /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d tudominio.com
```

## 6. Actualizar después
```bash
cd /var/www/stock-mr && git pull && npm ci && npm run build && pm2 restart stock-mr
```

## Respaldos (recomendado)
```bash
pg_dump -U stockmr -h 127.0.0.1 stockmr | gzip > backup-$(date +%F).sql.gz
```

