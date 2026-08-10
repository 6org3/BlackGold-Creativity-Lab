# Despliegue de Creativity Lab

## Distribución

- El servidor ejecuta la interfaz, la cola y el archivista.
- El PC Windows conserva ComfyUI y la RTX 4060 como nodo de render.
- Windows no ejecuta Linux, WSL ni Docker para este flujo: Atlas consume trabajos con scripts nativos y devuelve los renders.
- Telegram y Creativity Lab operan sobre la misma cola de System OS.
- Google Drive recibe copias verificadas. El archivista nunca usa `sync` ni elimina archivos locales.
- `CREATIVITY_LAB_PUBLIC_URL` fija el origen público usado por login y logout;
  en el despliegue actual debe ser `https://lab.blackgoldec.com`.

## Google Drive

La ruta remota es `Black Gold/Creativity Lab` con las carpetas `00_Inbox`, `01_Briefs`, `02_References`, `03_Working`, `04_Review`, `05_Approved` y `99_Archive`.

Crear un cliente OAuth de escritorio propio en Google Cloud, habilitar Drive API y autorizar el remoto `blackgold-drive` con rclone. La configuración final vive únicamente en `/mnt/datos/creativity-lab/rclone/rclone.conf` y nunca entra en Git.

Usar el alcance `drive.file`: limita el acceso del archivista a los archivos que crea o abre mediante la aplicación. Si en el futuro debe adoptar una carpeta existente, ampliar el alcance será una decisión explícita.

## Proveedor

System OS + ComfyUI es la ruta predeterminada. MuAPI permanece disponible solo como adaptador premium futuro mediante `ENABLE_MUAPI=true`; la clave nunca se expone al navegador.

## Biblioteca de archivos

Antes del primer despliegue, crear el volumen persistente con permisos para el usuario `node` del contenedor:

```bash
sudo install -d -o 1000 -g 1000 -m 0750 /mnt/datos/creativity-lab/assets
```

Los archivos descartados permanecen en este volumen y pueden restaurarse. El Lab no ofrece borrado físico desde la interfaz.

La cuota predeterminada es 10 GB y el Lab reserva al menos 1 GB libre. Se pueden ajustar con `CREATIVITY_ASSET_QUOTA_BYTES` y `CREATIVITY_ASSET_MIN_FREE_BYTES` en `ops/.env`. Cada archivo admite hasta 50 MB, con un máximo de 8 archivos y 100 MB por lote.

### Contrato API interno

- `GET /api/assets`: lista el catálogo recuperable.
- `POST /api/assets` con `multipart/form-data`: recibe `files`, `content_item_id` y `note`; responde `201` o `400/413/415/507`.
- `POST /api/assets` con JSON: registra la decisión sobre un artefacto generado; `status` admite `active` o `discarded`.
- `PATCH /api/assets/:assetId`: actualiza `status`, `content_item_id` o `note`; la descarga usa `GET /api/assets/:assetId/file`.

## Contexto editorial privado

El Vault completo y el CRM nunca se montan en el contenedor web. Shaka prepara en el servidor un snapshot saneado, sin PII, con solo hechos aprobados, tono, límites y señales agregadas. Creativity Lab lo monta en modo de solo lectura desde `/mnt/datos/creativity-lab/knowledge/creative-context.json`; si falta o está dañado, usa el contexto seguro integrado y lo informa en la interfaz.

Antes del despliegue inicial:

```bash
sudo install -d -o 1000 -g 1000 -m 0750 /mnt/datos/creativity-lab/knowledge
sudo install -o 1000 -g 1000 -m 0640 lib/creative-context-default.json /mnt/datos/creativity-lab/knowledge/creative-context.json
```

El heartbeat de Shaka debe regenerar el archivo desde Knowledge Vault, Atlas, Pitágoras y Lily cada 15 minutos, escribiendo primero un temporal y renombrándolo al final. Solo admite señales agregadas del CRM y referencias internas a archivos; nunca nombres, teléfonos, historiales individuales ni URLs públicas de fotos de menores.

Todas estas rutas requieren la sesión del Lab. Los errores mantienen el formato `{ "ok": false, "error": "…" }`.
