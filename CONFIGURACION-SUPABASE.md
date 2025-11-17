# 🔧 Guía de Configuración de Supabase

## ⚠️ Problema: No se conecta a la base de datos

Si el proyecto no se conecta a Supabase, necesitas configurar las variables de entorno.

---

## 📋 Pasos para Configurar Supabase

### 1. Obtener las Credenciales de Supabase

#### Opción A: Si ya tienes un proyecto de Supabase

1. Ve a [https://supabase.com](https://supabase.com) e inicia sesión
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Encontrarás:
   - **Project URL**: Algo como `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: Una clave larga que empieza con `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### Opción B: Si necesitas crear un nuevo proyecto

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en **New Project**
4. Completa el formulario:
   - Nombre del proyecto
   - Contraseña de la base de datos
   - Región (elige la más cercana a Costa Rica)
5. Espera a que se cree el proyecto (puede tardar unos minutos)
6. Una vez creado, ve a **Settings** → **API** para obtener las credenciales

---

### 2. Crear el Archivo de Variables de Entorno

1. En la raíz del proyecto, crea un archivo llamado `.env.local`
2. Copia el contenido del archivo `.env.local.example` (si existe) o usa esta plantilla:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase_aqui
```

3. Reemplaza los valores con tus credenciales reales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTg3NjgwMCwiZXhwIjoxOTYxNDUyODAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 3. Verificar la Configuración

#### Método 1: Página de Debug (Recomendado)

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a: `http://localhost:3000/debug-supabase`
3. Verifica que aparezcan:
   - ✅ URL configurada
   - ✅ Key configurada
   - ✅ Conexión exitosa

#### Método 2: Verificar en la Consola

1. Abre la consola del navegador (F12)
2. Ve a cualquier página del dashboard
3. Busca errores relacionados con Supabase
4. Si ves errores como "NEXT_PUBLIC_SUPABASE_URL is not defined", significa que las variables no están configuradas

---

## 🗄️ Configurar la Base de Datos

### Importante: Estructura de Tablas

El proyecto espera las siguientes tablas en Supabase:

1. **`usuarios`** - Usuarios del sistema
2. **`pedidos`** - Pedidos del sistema
3. **`Inventario`** - Inventario de productos
4. **`liquidaciones`** - Liquidaciones de mensajeros
5. **`gastos_mensajero`** - Gastos de mensajeros

### Opción A: Si tienes un proyecto existente

Si el proyecto original ya tiene la base de datos configurada, puedes:

1. **Exportar la estructura** del proyecto original
2. **Importarla** en tu nuevo proyecto de Supabase
3. O **usar las mismas credenciales** del proyecto original (si tienes acceso)

### Opción B: Crear las tablas desde cero

En el proyecto hay archivos SQL que puedes ejecutar:

1. `setup-supabase.sql` - Estructura básica
2. `insert-test-data.sql` - Datos de prueba (opcional)

**Pasos para ejecutar SQL en Supabase:**

1. Ve a tu proyecto en Supabase
2. Ve a **SQL Editor**
3. Crea una nueva consulta
4. Copia y pega el contenido del archivo SQL
5. Haz clic en **Run**

---

## 🔍 Solución de Problemas

### Error: "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Solución:**
- Verifica que el archivo `.env.local` existe en la raíz del proyecto
- Verifica que las variables empiezan con `NEXT_PUBLIC_`
- Reinicia el servidor de desarrollo (`npm run dev`)

### Error: "Invalid API key" o "Invalid URL"

**Solución:**
- Verifica que copiaste correctamente la URL y la key
- Asegúrate de que no hay espacios extra
- Verifica que la URL termina en `.supabase.co` (no `.com`)

### Error: "relation does not exist" o "table does not exist"

**Solución:**
- Las tablas no están creadas en tu base de datos
- Ejecuta los archivos SQL mencionados arriba
- O importa la estructura desde el proyecto original

### Error: "permission denied" o "RLS policy violation"

**Solución:**
- Ve a Supabase → **Authentication** → **Policies**
- Verifica que las políticas RLS (Row Level Security) están configuradas
- O temporalmente deshabilita RLS para probar:
  ```sql
  ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;
  ```

### El servidor no detecta los cambios en `.env.local`

**Solución:**
- Detén el servidor (Ctrl+C)
- Reinicia con `npm run dev`
- Las variables de entorno solo se cargan al iniciar el servidor

---

## ✅ Verificación Final

Una vez configurado, deberías poder:

1. ✅ Iniciar sesión en el sistema
2. ✅ Ver pedidos en el dashboard
3. ✅ Ver inventario
4. ✅ Crear nuevos pedidos

### Página de Prueba

Visita `http://localhost:3000/debug-supabase` para verificar:
- ✅ Variables de entorno configuradas
- ✅ Conexión a Supabase exitosa
- ✅ Tablas accesibles
- ✅ Datos disponibles

---

## 📞 Obtener Ayuda

Si sigues teniendo problemas:

1. Revisa la página de debug: `/debug-supabase`
2. Revisa la consola del navegador (F12) para errores
3. Revisa los logs del servidor en la terminal
4. Verifica que las credenciales sean correctas en Supabase

---

## 🔐 Seguridad

**IMPORTANTE:**
- ❌ **NUNCA** subas el archivo `.env.local` a Git
- ✅ El archivo `.env.local` ya está en `.gitignore`
- ✅ Solo comparte las credenciales con personas autorizadas
- ✅ Si expusiste las credenciales, regenera las keys en Supabase

---

## 📝 Notas Adicionales

- Las variables que empiezan con `NEXT_PUBLIC_` son accesibles en el navegador
- Si cambias las variables, **debes reiniciar el servidor**
- Para producción, configura estas variables en tu plataforma de hosting (Vercel, Railway, etc.)

---

*Última actualización: Diciembre 2024*
