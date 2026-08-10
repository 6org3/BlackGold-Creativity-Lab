# Despliegue de Creativity Lab

## Distribución

- El servidor ejecuta la interfaz, la cola y el archivista.
- El PC Windows conserva ComfyUI y la RTX 4060 como nodo de render.
- Telegram y Creativity Lab operan sobre la misma cola de System OS.
- Google Drive recibe copias verificadas. El archivista nunca usa `sync` ni elimina archivos locales.

## Google Drive

La ruta remota es `Black Gold/Creativity Lab` con las carpetas `00_Inbox`, `01_Briefs`, `02_References`, `03_Working`, `04_Review`, `05_Approved` y `99_Archive`.

Crear un cliente OAuth de escritorio propio en Google Cloud, habilitar Drive API y autorizar el remoto `blackgold-drive` con rclone. La configuración final vive únicamente en `/mnt/datos/creativity-lab/rclone/rclone.conf` y nunca entra en Git.

Usar el alcance `drive.file`: limita el acceso del archivista a los archivos que crea o abre mediante la aplicación. Si en el futuro debe adoptar una carpeta existente, ampliar el alcance será una decisión explícita.

## Proveedor

System OS + ComfyUI es la ruta predeterminada. MuAPI permanece disponible solo como adaptador premium futuro mediante `ENABLE_MUAPI=true`; la clave nunca se expone al navegador.
