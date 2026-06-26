# Hollow Cotizadores

Sistema web para cotizar productos de fabricación publicitaria, enfocado actualmente en **cajas de luz** y preparado para integrar el cotizador de **letras de canal**.

El proyecto permite calcular materiales, costos internos, utilidad, IVA, precio final, historial de cotizaciones, roles de usuario y administración de costos desde una aplicación web conectada a Supabase.

---

## Estado actual del proyecto

El proyecto ya cuenta con una base funcional en producción/despliegue mediante Vercel y repositorio en GitHub.

Actualmente incluye:

- Aplicación web con Next.js.
- Autenticación con Supabase.
- Control de acceso por roles.
- Panel principal según permisos del usuario.
- Cotizador funcional de cajas de luz.
- Catálogo de costos conectado a base de datos.
- Guardado de cotizaciones.
- Historial de cotizaciones.
- Detalle de cotización.
- Panel de administrador.
- Control de límite para usuario invitado.
- Pantalla de acceso no autorizado.
- Preparación inicial para cotizador de letras de canal.

---

## Tecnologías utilizadas

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Supabase**
- **Vercel**
- **Zod**
- **ExcelJS**
- **ESLint**

---

## Módulos principales

### 1. Panel principal

Ruta principal del sistema.

Desde aquí el usuario puede acceder a las herramientas disponibles según su rol:

- Cotizador de cajas de luz.
- Historial de cotizaciones.
- Catálogo de costos.
- Panel de administrador.
- Inicio y cierre de sesión.

El menú cambia dependiendo del rol del usuario.

---

### 2. Autenticación

El sistema usa Supabase Auth para iniciar sesión con correo y contraseña.

Funciones incluidas:

- Inicio de sesión.
- Cierre de sesión.
- Validación de usuario activo.
- Redirección a login si no hay sesión.
- Obtención del perfil del usuario desde Supabase.
- Validación de permisos por rol.

---

## Roles y permisos

El sistema contempla los siguientes roles:

### Admin

Puede acceder a todo el sistema.

Permisos:

- Usar cotizadores.
- Ver historial general de cotizaciones.
- Ver y editar catálogo de costos.
- Ver costos internos.
- Ver utilidad y margen.
- Ver panel de administración.
- Ver usuarios, actividad, presencia y eventos de uso.

### Vendedor

Puede usar el sistema comercialmente.

Permisos:

- Usar cotizadores.
- Ver sus cotizaciones.
- Ver precio sin IVA.
- Ver IVA.
- Ver total con IVA.
- Ver texto de cotización para cliente.
- Guardar cotizaciones.
- Ver historial de sus cotizaciones.
- Ver estado de cotización.
- Ver cliente, proyecto y medidas.
- Ver costo directo.
- Ver utilidad.
- Ver margen interno.
- Ver costo unitario.
- Ver total interno por material.
- Ver materiales con precios.
- Consultar catálogo de costos.

### Producción

Rol pensado para revisar información de fabricación sin mostrar precios internos.

Permisos:

- Usar cotizadores.
- Ver materiales, SKUs y cantidades.
- Ver información necesaria para producción.
- No debe ver costos unitarios ni totales internos.

### Viewer

Rol de consulta.

Permisos:

- Puede consultar cotizaciones cuando esté autorizado.
- No edita costos.
- No administra usuarios.

### Invitado

Rol limitado para pruebas o acceso temporal.

Permisos:

- Usar el cotizador con límite.
- Ver precio de venta cuando aplique.
- No ver costos internos.
- No editar catálogo.
- No acceder a administración.
- Tiene límite de usos del cotizador.

---

## Límite de usuario invitado

Se implementó control de uso para el rol **invitado**.

El flujo contempla:

- Validar si el usuario invitado está activo.
- Revisar límite disponible.
- Consumir un uso al entrar o activar el cotizador.
- Bloquear acceso cuando se agotan los usos.
- Mostrar mensaje de acceso restringido.

El límite definido para invitado es de **5 usos**.

---

## Cotizador de cajas de luz

El cotizador de cajas de luz es el módulo más avanzado del proyecto.

Permite calcular una cotización con base en:

- Cliente.
- Vendedor.
- Proyecto.
- Tipo de caja.
- Cantidad.
- Ancho en metros.
- Alto en metros.
- Canto automático o manual.
- Número de vistas.
- Tipo de carátula.
- Tipo de iluminación.
- Instalación.
- Condición de altura.
- Zona de traslado.
- Tipo de traslado.
- Diseño gráfico.
- Personas de fabricación.
- Personas de instalación.
- Horas automáticas o manuales.
- Material extra.
- Andamios.
- Descolgadas.
- Separación de lámparas.
- Watts por lámpara.
- Tiras LED por m².
- Margen.
- IVA.
- Observaciones.

---

## Tipos de caja de luz

El sistema contempla los siguientes tipos:

- Una vista.
- Doble vista.
- Bandera.
- Paleta.
- Suajada.

---

## Opciones de carátula

Las opciones actuales son:

- Lona backlight impresa.
- Lona backlight rotulada.
- Acrílico rotulado con vinil de corte.
- Acrílico rotulado con impresión de vinil.
- Policarbonato.
- Otro.

---

## Opciones de iluminación

El cotizador permite seleccionar:

- Lámparas LED.
- Módulos LED normales.
- Módulos LED ultra brillantes.
- Micro LEDs.
- Sin iluminación.

---

## Reglas de iluminación

### Módulos LED

Cada tira contiene **20 módulos**.

Consumo definido por módulo:

- LED normal: **0.72 W por módulo**.
- LED ultra brillante: **1.5 W por módulo**.
- Micro LED: **0.2 W por módulo**.

### Fuentes de poder

Las fuentes se calculan solo cuando se usan módulos LED.

Las lámparas LED no requieren fuente dentro del cálculo.

Regla aplicada:

- Hasta 21 W: 1 fuente de 30 W.
- Hasta 42 W: 1 fuente de 60 W.
- Mayor a 42 W: fuentes de 100 W calculadas por capacidad útil de 70 W.

---

## Reglas de canto

El canto puede calcularse de forma automática según el tipo de caja y la iluminación.

Reglas actuales:

- Doble vista, bandera o paleta: canto de 40 cm.
- Caja con lámparas LED: canto de 22 cm.
- Caja con módulos LED: canto de 10 cm.
- Caja sin iluminación: canto de 10 cm.

También existe opción de capturar canto manual.

---

## Reglas de estructura

El sistema calcula estructura con base en tipo de caja y área.

Materiales contemplados:

- Tubular 1 x 1.
- Tubular 3/4 x 3/4.
- Tubular 1/2 x 1/2.
- Soldadura 6013.

También calcula:

- Perímetro.
- Tramos de tubular.
- Inserciones.
- Varillas de soldadura.

---

## Mano de obra

Se separó la mano de obra en:

- Mano de obra de fabricación.
- Mano de obra de instalación.

Los SKUs principales son:

- `MO_FABRICACION_HORA`
- `MO_INSTALACION_HORA`

El cálculo considera:

- Horas de fabricación.
- Horas de instalación.
- Personas asignadas.
- Horas-hombre.
- Incrementos por altura o condición especial.

---

## Instalación

El sistema permite indicar si la cotización incluye instalación.

Condiciones contempladas:

- A nivel de piso / baja altura.
- A 3 metros.
- A 4 metros.
- Mayor a 4 metros.
- Con escalera.
- Con andamios.
- En fachada.
- En techo.
- En altura con descolgada.
- Instalación especial.

Cada condición puede aplicar un porcentaje extra sobre mano de obra de instalación.

---

## Traslados

El sistema permite seleccionar zonas de traslado.

La configuración contempla:

- Código de zona.
- Nombre de zona.
- Descripción o cobertura.
- Costo por trabajo.
- Costo por entrega.
- Porcentaje de descuento para entrega.
- Estado activo.
- Orden de visualización.

---

## Diseño gráfico

El cotizador incluye opciones de diseño gráfico por tiempo.

Opciones base:

- No lleva diseño.
- 15 minutos.
- 30 minutos.
- 45 minutos.
- 60 minutos.
- 90 minutos.
- 120 minutos.
- 150 minutos.
- 180 minutos.
- 240 minutos.

Cada opción puede tener precio propio y orden de aparición.

---

## Cálculo de costos

El cotizador genera:

- Costo directo.
- Precio sin IVA.
- IVA.
- Total con IVA.
- Utilidad.
- Margen.
- Partidas de materiales.
- Validaciones.
- Texto de cotización para cliente.

El margen base utilizado en el formulario es **40%**.

---

## Texto de cotización

El sistema genera un texto automático de cotización con:

- Medidas.
- Fondo/canto.
- Número de vistas.
- Carátula.
- Iluminación.
- Instalación.
- Traslado.
- Diseño.
- Observaciones.

Este texto está pensado para copiarse y enviarse al cliente.

---

## Guardado de cotizaciones

Las cotizaciones de cajas de luz se guardan en Supabase.

Se almacena:

- Usuario que guardó la cotización.
- Número de cotización.
- Tipo de cotización.
- Cliente.
- Vendedor.
- Proyecto.
- Datos del formulario.
- Resultado calculado.
- Partidas de materiales.
- Costo directo.
- Precio sin IVA.
- IVA.
- Total con IVA.
- Utilidad.
- Margen.
- Estado.
- Notas.

El número de cotización usa formato similar a:

```txt
CL-AAAAMMDD-XXXXXX
```

---

## Historial de cotizaciones

El sistema incluye un historial de cotizaciones para cajas de luz.

Funciones:

- Listado de cotizaciones guardadas.
- Filtro por búsqueda.
- Filtro por estado.
- Visualización de total cotizado.
- Conteo de borradores.
- Conteo de aprobadas.
- Acceso al detalle de cada cotización.

El administrador puede ver todas las cotizaciones.

Los usuarios no administradores solo ven sus propias cotizaciones.

---

## Detalle de cotización

Cada cotización tiene una vista de detalle.

Incluye:

- Número de cotización.
- Título.
- Cliente.
- Proyecto.
- Vendedor.
- Fecha de creación.
- Estado.
- Texto de cotización.
- Costos principales.
- Partidas agrupadas por tipo.
- SKUs.
- Cantidades.
- Unidades.
- Costos unitarios.
- Totales.
- Notas.

---

## Estados de cotización

Estados contemplados:

- BORRADOR.
- ENVIADA.
- APROBADA.
- RECHAZADA.
- CANCELADA.

---

## Catálogo de costos

El sistema cuenta con un catálogo conectado a la tabla `cost_catalog`.

Campos principales:

- SKU.
- Nombre.
- Categoría.
- Unidad.
- Costo.
- Precio de venta.
- Estado activo.
- Notas.

Funciones:

- Buscar materiales.
- Filtrar por categoría.
- Consultar materiales activos.
- Agregar nuevos costos.
- Editar costos existentes.
- Marcar materiales activos o inactivos.

Solo el administrador puede editar.

El vendedor puede consultar el catálogo en modo lectura.

---

## Panel de administrador

El sistema incluye un panel administrativo.

Funciones actuales:

- Ver usuarios registrados.
- Ver roles.
- Ver si un usuario está activo.
- Ver límite de cotizador.
- Ver usos consumidos.
- Ver usos restantes.
- Ver total de cotizaciones.
- Ver eventos de uso.
- Ver usuarios activos recientemente.
- Ver presencia por ruta o módulo.
- Revisar cuenta invitado.

Tablas consultadas:

- `user_profiles`
- `quotes`
- `usage_events`
- `user_presence`

---

## Acceso no autorizado

Se implementó una pantalla de acceso denegado.

Se muestra cuando:

- El usuario no tiene permisos.
- El usuario está inactivo.
- El rol no puede entrar a una sección.
- El invitado supera su límite.
- Se intenta acceder a administración sin ser admin.

---

## Cotizador de letras de canal

El proyecto ya tiene una ruta inicial para letras de canal.

Estado actual:

- Ruta creada.
- Vista base agregada.
- Pendiente implementar cálculo completo.

La idea del módulo es integrar posteriormente:

- Cálculo de letras.
- LEDs.
- Fuentes.
- Materiales.
- Mano de obra.
- Validación de diseño.
- Reglas de instalación.

---

## Estructura del proyecto

```txt
Hollow-Cotizadores/
├── app/
│   ├── admin/
│   ├── catalago/
│   ├── catalogo-costos/
│   ├── cotizaciones/
│   │   └── [id]/
│   ├── cotizadores/
│   │   ├── cajas-luz/
│   │   │   ├── _lib/
│   │   │   │   ├── calculator.ts
│   │   │   │   ├── format.ts
│   │   │   │   ├── rules.ts
│   │   │   │   └── types.ts
│   │   │   ├── actions.ts
│   │   │   ├── CajasLuzForm.tsx
│   │   │   ├── GuestUsageGate.tsx
│   │   │   └── page.tsx
│   │   └── letras-canal/
│   ├── login/
│   ├── logout/
│   ├── no-autorizado/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AccessDenied.tsx
│   └── AppTopBar.tsx
├── public/
├── utils/
│   ├── auth/
│   └── supabase/
├── package.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

---

## Variables de entorno

Para correr el proyecto se necesitan las variables de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Estas variables deben configurarse localmente en `.env.local` y también en Vercel.

---

## Instalación local

Clonar el repositorio:

```bash
git clone https://github.com/HOLLOMOX/Hollow-Cotizadores.git
cd Hollow-Cotizadores
```

Instalar dependencias:

```bash
npm install
```

Crear manualmente el archivo de variables de entorno:

```bash
touch .env.local
```

Agregar las variables reales de Supabase en `.env.local`.

Ejecutar en desarrollo:

```bash
npm run dev
```

Abrir en el navegador:

```txt
http://localhost:3000
```

---

## Scripts disponibles

```bash
npm run dev
```

Ejecuta el servidor de desarrollo.

```bash
npm run build
```

Genera la versión de producción.

```bash
npm run start
```

Ejecuta la aplicación compilada.

```bash
npm run lint
```

Ejecuta ESLint.

---

## Base de datos

El sistema depende de Supabase.

Tablas y funciones usadas por el proyecto:

### Tablas

- `user_profiles`
- `cost_catalog`
- `quotes`
- `usage_events`
- `user_presence`
- `installation_conditions`
- `transport_zones`
- `design_options`

### RPC / funciones

- `get_my_profile`
- `get_cotizador_access`
- `consume_cotizador_use`

---

## Despliegue

El proyecto está preparado para desplegarse en Vercel.

Pasos generales:

1. Subir cambios a GitHub.
2. Conectar repositorio en Vercel.
3. Configurar variables de entorno.
4. Ejecutar deploy.
5. Revisar que Supabase esté conectado correctamente.

---

## Pendientes recomendados

- Completar cotizador de letras de canal.
- Agregar exportación PDF de cotizaciones.
- Agregar exportación Excel de cotizaciones o materiales.
- Mejorar vista especial para producción sin costos.
- Crear módulo de clientes.
- Crear módulo de proyectos.
- Agregar numeración más controlada de cotizaciones.
- Agregar edición de cotizaciones guardadas.
- Agregar permisos más detallados desde base de datos.
- Agregar respaldo o importación masiva del catálogo de costos.
- Agregar documentación SQL de Supabase.
- Agregar capturas de pantalla al README.
- Agregar guía de uso para vendedores y producción.

---

## Resumen

Hollow Cotizadores es una herramienta interna para cotizar fabricación publicitaria de forma más ordenada, rápida y controlada.

El objetivo es centralizar:

- Cálculos técnicos.
- Costos internos.
- Precios de venta.
- Historial de cotizaciones.
- Control por usuarios.
- Control de permisos.
- Administración de materiales y costos.

Actualmente el módulo más completo es el cotizador de cajas de luz, mientras que el cotizador de letras de canal queda preparado para desarrollo posterior.
