# Mayoriza - Frontend Web App

Este es el cliente web oficial del proyecto **Mayoriza**, un sistema de gestión contable integral. Está construido con Angular y diseñado para proporcionar una interfaz de usuario rápida, robusta y completamente responsiva para administradores y contadores.

---

## 🛠️ Arquitectura y Tecnologías

El frontend sigue los estándares modernos de desarrollo de interfaces de usuario:

- **Framework:** Angular (TypeScript)
- **Estilos e Interfaz:** Angular Material, SCSS, y utilidades modernas de CSS.
- **Gráficos:** Chart.js (Visualización de datos financieros)
- **Generación de Reportes:** jsPDF (Exportación a documentos formales)
- **Cliente de Base de Datos:** Supabase JS (Para la interacción directa y autenticación)

---

## 🚀 Configuración y Entornos

El proyecto utiliza un script dinámico de Node.js (`setenv.js`) que se encarga de inyectar las variables de entorno en los archivos `environment.ts` de Angular al momento de construir o servir la aplicación.

### Variables de Entorno

Debes crear un archivo `.env` en la raíz de esta carpeta (frontend) con las siguientes variables (referencia `.env.example` si aplica):

```env
# URL y Llave pública de Supabase
SUPABASE_URL="https://[tu-id-supabase].supabase.co"
SUPABASE_PUBLISHABLE_KEY="tu-llave-anon-publica"

# URL de la API del Backend (Render / Localhost)
API_URL="http://localhost:3000/api" 
# En producción sería algo como: https://mayoriza-backend.onrender.com/api
```

---

## 💻 Instrucciones de Ejecución (Desarrollo local)

1. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

2. **Levantar el servidor de desarrollo:**
   ```bash
   pnpm run start
   ```
   *(Este comando inyectará automáticamente las variables de tu archivo `.env` local en Angular).*

3. Abre tu navegador en `http://localhost:4200/`.

---

## 🌍 Despliegue en Vercel (Producción)

El proyecto está preparado y optimizado para ser desplegado en **Vercel** de manera automática. Vercel detectará que es un proyecto de Angular y configurará casi todo por defecto.

### Configuración en Vercel:

1. **Framework Preset:** `Angular`
2. **Build Command:** `pnpm run build` (o `npm run build`)
3. **Output Directory:** `dist/frontend/browser` *(Vercel lo debería autodetectar)*
4. **Environment Variables:** Debes agregar manualmente en la pestaña de variables de entorno de Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `API_URL` (Debe apuntar a la URL de tu backend en Render, ¡no olvides el `/api` al final si aplica!).

Una vez configurado, cualquier `push` a la rama principal actualizará automáticamente la aplicación.

---

## 🛡️ Consideraciones de Seguridad y Limpieza

- Los archivos `.env` están ignorados por el `.gitignore` por defecto.
- Se han bloqueado los rastros de herramientas de IA (`.cursor`, `.gemini`, `.ai`) y el caché de `pnpm` para mantener la base de código completamente limpia y segura en GitHub.
