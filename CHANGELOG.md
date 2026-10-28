# CHANGELOG

## Version 1.0.91 (2026-10-27)

- Desarrollo por red: allowedDevOrigins toma la IP detectada para el QR; corrige el bloqueo del WebSocket HMR al acceder desde esa IP, sin fijarla en el código ni aceptar cualquier origen.

## Version 1.0.90 (2026-10-27)

- Inicio: botón «Descargar App» a la izquierda de «Nueva orden de trabajo»; abre un modal con QR, marco visual e instrucciones breves para Android e iPhone. Lee la URL al pulsar; en localhost sustituye el host por la IP de red del equipo y conserva puerto, ruta y parámetros. Sin dominios fijos ni servicios externos. Biblioteca qrcode-generator 2.0.4, cargada a pedido.
- Login: callback y página de error conservan el origen público del pedido, evitando el puerto interno 3000 y el rechazo Incorrect redirect_uri; se documenta el acceso local por IP y el emisor de identidad.

## Version 1.0.89 (2026-10-27)

- Usuarios: el listado inicial muestra solo activos. Filtros avanzados permite Activos, Inactivos y Todos; conserva la elección durante búsquedas, ordenación y paginación y vuelve a Activos al limpiar.

## Version 1.0.88 (2026-10-27)

- Inicio: octava tarjeta «Sin asignar» con contador real y acceso al listado filtrado. Órdenes de trabajo conserva el filtro en búsqueda, paginación y vista de calendario.

## Version 1.0.87 (2026-10-27)

- Sesión: los fallos de sesión del servidor se registran mediante la API, con respaldo local temporal mientras la API o la base no responden.

## Version 1.0.86 (2026-10-27)

- Sesión: la lectura inicial de `/api/v1/sesion` reintenta hasta dos veces cuando la API local está temporalmente indisponible o devuelve un error 5xx; conserva el error tras agotar los intentos y no reintenta respuestas de permisos.

## Version 1.0.85 (2026-10-27)

- Reportes: consumo de repuestos en unidades y controles independientes para ocultar o mostrar cada indicador, gráfica y reporte desde Configuración → Reportes.

## Version 1.0.84 (2026-10-27)

- Reportes: se retiran las reparaciones atípicas y el patrón de fallas por modelo; se conserva el análisis de intervalos entre correctivas.

## Version 1.0.83 (2026-10-27)

- Análisis avanzado: tres dispersiones de correctivas frente a edad, horas de uso y kilómetros de uso, con tablas de edad, lectura, fecha, modelo y órdenes; estados de carga, vacío y error y controles individuales de visibilidad.

## Version 1.0.82 (2026-10-27)

- Reportes A13: resumen por empresa cliente en Maquinaria, con selector de órdenes, correctivas, horas de parada o reincidencias; barras, tabla completa, filtros compartidos y explicación del cálculo.

## Version 1.0.81 (2026-10-27)

- Reportes A12: en Maquinaria, selector de modelo, gráfica de los repuestos más frecuentes y tabla completa con órdenes correctivas asociadas y con suministro; estados de carga, vacío y error, filtros compartidos y explicación de alcance.

## Version 1.0.80 (2026-10-27)

- Reportes A10 integrado en A18: comparación de las cuatro etapas por media, mediana, P90 y cantidad de órdenes, con identificación de la media mayor y tabla accesible. Usa la misma respuesta y conserva gráficas, referencias y lista de demoras existentes.

## Version 1.0.79 (2026-10-27)

- A9 en Maquinaria: mapa de calor de doce meses por tipo de máquina, cifras y totales, alternativa tabular, desplazamiento horizontal por teclado y estados de carga, vacío y error. Contrato validado y filtros de fecha, cliente y activo.

## Version 1.0.78 (2026-10-27)

- Reportes A18 en Proceso: cuatro gráficas con media, mediana y línea de referencia, tablas y órdenes demoradas con etapa, exceso y enlace. Nueva configuración de umbrales con restablecimiento al promedio histórico.
- Resumen: vuelve la fila de cuatro bloques en escritorio; orden, tiempo hasta inicio, tiempo hasta cierre y Atención necesaria en la cuarta columna. En móvil se apilan.

## Version 1.0.77 (2026-10-27)

- Reportes A17: tarjeta de mantenimiento planificado en horas dentro de Maquinaria, variación frente al período anterior y tendencia de seis meses, barras apiladas mensuales y desglose por tipo de máquina con alternativa tabular. Se explica que son horas transcurridas de creación a cierre con pausas, y se distingue «Sin dato» de 0 %.

## Version 1.0.76 (2026-10-27)

- Reportes: franja de avisos con ícono, conteos por gravedad y control «Ver detalle / Ocultar»; lista agrupada en críticos y de atención, con encabezado adaptado a móvil.
- Resumen general: estado, prioridad, tipo y activos se alinean en cuatro columnas en escritorio; los repuestos con bajo stock ocupan todo el ancho. En móvil se apilan.
- Descarga: control discreto «Descargar PDF o CSV» que despliega el formulario debajo.

## Version 1.0.75 (2026-10-27)

- Filtros: la fecha es un solo selector con un calendario de dos meses y atajos (hoy, últimos 7 o 30 días, este mes, mes pasado, este año) en Reportes, Órdenes de trabajo y Movimientos de stock; desaparece el interruptor de rango y el segundo campo de fecha. Campos más prolijos, del mismo alto y con foco claro.
- Reportes: la sección «Alertas y desempeño operativo» pasa a ir justo debajo del resumen general.
- Pantallas: se corrige el desplazamiento horizontal de más en Reportes y en el calendario de órdenes, causado por tablas solo para lectores de pantalla y por un ancho mínimo de las tablas.

## Version 1.0.74 (2026-10-27)

- Reportes: pantalla más limpia, con tres tarjetas de indicadores clave arriba, una franja de avisos que solo aparece si hay y secciones plegables (Resumen, Maquinaria, Proceso, Análisis avanzado y Alertas) que cargan al abrirse. Nuevas gráficas con alternativa en tabla y explicación de su cálculo: Pareto de la parada, tiempo de reparación, preventivo frente a reactivo, órdenes creadas frente a cerradas, antigüedad de las órdenes, cumplimiento preventivo, horas en pausa por motivo, comparación de períodos, órdenes atípicas y desgaste.
- Órdenes: interruptor Lista/Calendario con un calendario de uno a tres meses, filtros, leyenda y vencidas que filtran, íconos de ver y modificar y detalle en un modal; línea de tiempo de etapas y recorrido con flechas en el detalle de cada orden, sin mostrar personas.
- Órdenes: el formulario suma tiempo estimado, causa de falla, lectura de uso (horómetro u odómetro según el activo) y tipo de motivo; el detalle muestra el historial de la lectura.
- Activos: nueva unidad de uso (horas o kilómetros).
- Configuración: nueva pantalla de avisos de ineficiencia para ajustar los umbrales.

## Version 1.0.73 (2026-10-27)

- Documentación técnica: al subir un documento para las sugerencias de IA ya no hay que esperar a que se procese; el listado y el detalle muestran si está «En cola», «Procesando…», listo o con «Error al procesar», y se actualizan solos cada 5 segundos mientras haya alguno en proceso.
- Documentación técnica: si el procesamiento falló, el detalle muestra el motivo y el botón «Volver a procesar».

## Version 1.0.72 (2026-10-27)

- Contratos: se pueden generar los tipos de la API desde su documento OpenAPI (`npm run api:tipos`) y una comprobación de compilación verifica que los contratos de usuarios y clientes del frontend tengan los mismos campos que la API.

## Version 1.0.71 (2026-10-27)

- Perfil: nueva pantalla «Mi perfil» para cambiar nombre, apellido y teléfono; correo y contraseña se muestran bloqueados con el aviso «Depende de la integración con Keycloak». Se abre desde el menú del usuario y desde Configuración.
- Configuración: ahora es un panel con opciones (Mi perfil y, con permiso, Términos y condiciones) y deja de saltar directo a los términos; el menú lateral la muestra a todas las personas.

## Version 1.0.70 (2026-10-27)

- Altas y modificaciones: si la pantalla se recarga o se abre la dirección directamente, el formulario sigue viéndose en un modal sobre la pantalla de origen (listado o detalle) en lugar de como página completa; al cerrarlo se vuelve a esa pantalla.
- Órdenes de trabajo: se quita el botón «Nuevo cliente» del formulario; la orden se asocia a un cliente ya registrado.

## Version 1.0.69 (2026-10-27)

- Listados: en Clientes, Órdenes, Activos, Modelos, Tipos, Documentación, Repuestos, Movimientos y Usuarios solo se ve el buscador; el resto de los filtros queda detrás del botón «Filtros avanzados» (se abre solo si hay uno aplicado y avisa con un punto).
- Reportes: los bloques ya no tienen desplazamiento horizontal y se reparten de a tres por fila; en «Órdenes recientes» el ojito queda centrado y prioridad y estado se ven con mayúscula inicial y los mismos colores que en Órdenes de trabajo, igual que en los bloques por estado, prioridad y tipo.

## Version 1.0.68 (2026-10-27)

- Navegación: en las pantallas de segundo nivel (detalles, altas y modificaciones) aparece arriba la ruta, por ejemplo «Órdenes de trabajo / Orden N° 8», con los niveles anteriores como enlaces para volver.
- Órdenes de trabajo: los filtros, salvo el buscador, quedan detrás del botón «Filtros avanzados» (se abren solos si hay alguno aplicado); el resumen pasa a una franja compacta; el estado y el técnico ya no saltan de línea; las fechas usan el mismo formato y los títulos de columna quedan alineados; el buscador deja de ocupar todo el ancho.
- Órdenes de trabajo: el editor de repuestos de la orden muestra de a cinco, con «Anterior» y «Siguiente».
- Detalles: la flecha de volver tiene el alto del bloque del título.
- Listados: el buscador de todos los listados tiene un ancho máximo.

## Version 1.0.67 (2026-10-27)

- Menú: «Activos» ya no es un enlace; al pulsarlo despliega o pliega sus opciones (con el menú retraído, además lo abre). La lista de activos queda como «Todos los activos».

## Version 1.0.66 (2026-10-27)

- Menú: la primera opción del submenú de Activos pasa a llamarse «Todos los activos», para no repetir el nombre de la sección.

## Version 1.0.65 (2026-10-27)

- Menú: con el menú abierto, el logo de CVM se agranda de forma notable y ocupa casi todo el ancho del menú.

## Version 1.0.64 (2026-10-27)

- Navegación: mientras se abre una pantalla, el contenido de la derecha se atenúa y se desenfoca y no recibe clics; el menú lateral sigue disponible para elegir otra opción.
- Menú: el submenú de Activos se despliega y se pliega con animación, y sus ítems entran de a uno.

## Version 1.0.63 (2026-10-27)

- Menú: las opciones con submenú desplegable (Activos) empiezan retraídas, se abren y se cierran con una flecha cuantas veces se quiera y se pliegan al retraer el menú.
- Navegación: el aviso «Abriendo…» aparece ahora en el centro de la pantalla, en una tarjeta con spinner.
- Menú: el logo de CVM se agranda un poco cuando el menú está abierto.

## Version 1.0.62 (2026-10-27)

- Menú: el número rojo de alertas de stock queda siempre pegado a la esquina del ícono de Repuestos, con el menú abierto o retraído, en lugar de irse a la derecha.

## Version 1.0.61 (2026-10-27)

- Reportes: los filtros de indicadores se ordenan en una cuadrícula pareja (ya no hay un desplegable que se estire por toda la fila) y «Descarga de reportes» ocupa todo el ancho, con los campos a la izquierda y los botones a la derecha, en lugar de quedar centrada en la pantalla.

## Version 1.0.60 (2026-10-27)

- Menú: al abrirse, el logo de CVM se desplaza al centro junto con el ensanche del menú y vuelve a la izquierda al retraerlo.

## Version 1.0.59 (2026-10-27)

- Listados: los selectores de fecha de los filtros (por ejemplo «Creada» en órdenes de trabajo) dejan de estirarse por toda la fila y quedan con un ancho razonable.

## Version 1.0.58 (2026-10-27)

- Clientes y usuarios: la cantidad de órdenes de cada fila abre el listado de órdenes filtrado por ese cliente o usuario y solo con órdenes activas, igual que la cifra. Los activos no lo necesitan: su detalle ya muestra el historial de órdenes.
- Clientes: el listado muestra solo los activos al entrar; un botón discreto «Filtros avanzados» permite ver inactivos o todos y filtrar por activos asociados.
- Usuarios: en el detalle, la actividad queda a la derecha de los datos en pantallas anchas.
- Menú: con el menú abierto, el botón se ensancha con él y la flecha queda al centro.
- Órdenes de trabajo: prioridad y estado se muestran con la primera letra en mayúscula.
- Formularios: el teléfono de clientes y usuarios se llama «Número de teléfono o celular».

## Version 1.0.57 (2026-10-27)

- Interfaz: en los modales de confirmación (por ejemplo, dar de baja un cliente) y en los formularios, los textos largos, como un nombre sin espacios, saltan de línea en lugar de salirse de la ventana.

## Version 1.0.56 (2026-10-27)

- Interfaz: las altas y modificaciones (órdenes de trabajo, clientes, activos, modelos, tipos, repuestos, usuarios y documentos técnicos) se abren en un modal desde los listados y detalles, con foco en el primer campo, confirmación al descartar cambios, tamaño amplio para formularios extensos y pantalla completa en el móvil. Abiertas por enlace directo se ven como página.

## Version 1.0.55 (2026-10-27)

- Reportes: se quitan el reporte de actividad por técnico, el cuadro de órdenes por técnico y el filtro «Técnico»; el análisis es de órdenes, procesos y maquinaria, sin evaluar personas.

## Version 1.0.54 (2026-10-27)

- Reportes: la pestaña «Análisis y alertas» suma la sección «Desempeño operativo» con las órdenes, los tiempos de respuesta, ejecución y revisión, las pausas y devoluciones con sus motivos, las reasignaciones y la maquinaria por tipo y por activo con sus horas de parada. No compara personas.

## Version 1.0.53 (2026-10-26)

- Órdenes de trabajo: el detalle muestra quién creó la orden («Creada por»).

## Version 1.0.52 (2026-10-26)

- Órdenes de trabajo: cada repuesto se asigna con una cantidad mediante un selector numérico limitado a las unidades disponibles; si no hay, avisa por qué (sin stock, reservado o entregado). Quien gestiona repuestos (administrador, jefe y pañolero) los cambia también desde el detalle, donde se ve la cantidad, el estado (reservado, entregado, descontado) y quién hizo cada cambio.
- Repuestos: el listado y el detalle muestran el stock en la empresa, lo reservado, lo entregado y lo disponible para órdenes. El jefe de mantenimiento ahora ve el módulo Repuestos.

## Version 1.0.51 (2026-10-26)

- Órdenes de trabajo: los estados pasan a ser Pendiente, En progreso, En revisión, Cerrado, Pausado y Eliminado (baja lógica). El detalle muestra de qué estado a cuál se pasó, quién lo hizo y el motivo, y suma un historial de técnicos; una orden eliminada queda solo para consulta.

## Version 1.0.50 (2026-10-26)

- Clientes: el listado tiene el interruptor «Solo con activos asociados» para ver únicamente los clientes que tienen activos; la columna «Activos asociados» ya se podía ordenar.

## Version 1.0.49 (2026-10-26)

- Órdenes de trabajo: la sugerencia de IA se pide con el activo de la orden (`activoId`), así la API busca solo en los manuales de esa máquina, de su modelo y en la documentación general.
- Órdenes de trabajo: si el asistente de IA no está disponible (`modo = sin_ia`), un aviso indica que se muestra el texto original del manual sin resumir y pide verificar los valores con la fuente.

## Version 1.0.48 (2026-10-26)

- Órdenes de trabajo: si falta el motivo al cambiar el estado desde el detalle, el aviso aparece debajo del campo «Motivo u observación» y lleva el cursor allí, en lugar de mostrarse arriba de la página.

## Version 1.0.47 (2026-10-26)

- Reportes: cada punto de «Atención necesaria» (prioridad alta pendientes, pendientes de validación y bajo stock) es un enlace que lleva directo al listado correspondiente.

## Version 1.0.46 (2026-10-25)

- Órdenes de trabajo: los colores, las acciones y los pasos permitidos de cada estado salen de la base (`tono` y `transiciones` de cada orden); la pantalla ya no nombra ningún estado.
- Órdenes de trabajo: el listado se puede filtrar por fase (pendientes, en curso, por validar, cerradas o canceladas) y el Inicio y las tarjetas de resumen cuentan por fase.
- Técnico: las acciones de la orden (Iniciar, Pausar, Reanudar, Finalizar) y su pedido de motivo vienen de la base, y «Mi trabajo» trae las órdenes pendientes y en curso.

## Version 1.0.45 (2026-10-25)

- Órdenes de trabajo: los filtros, los reportes, los formularios y las etiquetas toman los estados de la base; el combo de estado del detalle y de la modificación muestra solo los estados a los que se puede pasar desde el actual.
- Estados: nunca se muestra un valor como `en_ejecucion`; si falta la etiqueta, se muestra legible y con la primera letra en mayúscula.
- Formularios: el campo «Motivo del cambio de estado» (y cualquier campo de ancho completo dentro de una grilla) ocupa todo el ancho y queda alineado con el resto, sin el margen que lo desplazaba.
- Interfaz: los desplegables, botones, enlaces, casillas, selectores de fecha y demás elementos que se accionan sin escribir texto muestran el cursor de mano, y los deshabilitados el de no permitido; los campos de texto conservan el suyo.

## Version 1.0.44 (2026-10-25)

- Órdenes de trabajo: en el alta y la edición, el campo Cliente queda alineado con el campo Activo aunque este muestre su texto de ayuda debajo.

## Version 1.0.43 (2026-10-24)

- Órdenes de trabajo: el desplegable «Actualizar estado» del detalle ahora es igual al de «Asignar o modificar técnico» (mismo aspecto y comportamiento), en lugar de la lista nativa del navegador.

## Version 1.0.42 (2026-10-24)

- Navegación: el botón «Volver al listado» (y «Volver a activos», «Volver a repuestos», «Volver a movimientos») pasa a ser una flecha a la izquierda del título, con el texto como etiqueta accesible, en los detalles de órdenes, clientes, usuarios, activos, modelos, tipos, documentos, repuestos y movimientos, y en el alta y la edición de usuarios.

## Version 1.0.41 (2026-10-24)

- Vistas de detalle: los datos cortos se reparten en columnas y los largos (descripción, observaciones, repuestos y sugerencias) ocupan todo el ancho, con lo que la tarjeta principal de la orden de trabajo, los clientes, los activos, los modelos, los documentos, los repuestos y sus movimientos aprovecha mejor la pantalla. El estado de la orden se muestra como etiqueta.

## Version 1.0.40 (2026-10-24)

- Órdenes de trabajo: el menú del selector de técnico se ve completo sobre la tarjeta en lugar de quedar recortado dentro de ella; lo mismo vale para cualquier selector dentro de una tarjeta.

## Version 1.0.39 (2026-10-23)

- Clientes: el formulario muestra como ejemplo un celular con cero inicial y lo envía tal como se ingresó; la lista y el detalle conservan el formato guardado.

## Version 1.0.38 (2026-10-23)

- Roles: el tipo de rol del frontend incluye el estado que informa la API.

## Version 1.0.37 (2026-10-23)

- Usuarios: se quita el texto de ayuda sobre la cantidad de dígitos y el formulario muestra como ejemplo un celular con cero inicial. El teléfono recuperado para edición conserva el formato ingresado.

## Version 1.0.36 (2026-10-23)

- Listados: la ordenación local de texto usa español de Uruguay sin separar mayúsculas; conserva el orden natural de números dentro del texto.

## Version 1.0.35 (2026-10-23)

- Seguridad: se actualizan Zod, Vite y Vitest junto con sus dependencias de desarrollo para corregir los avisos detectados por `npm audit`.

## Version 1.0.34 (2026-10-23)

- Seguridad: se fijan Node.js 24.22.1 para CI y uso directo, y Node.js 26.12.1 para las imágenes Docker de desarrollo y producción, por CVE-2026-111497.

## Version 1.0.33 (2026-10-23)

- Integración: se reúnen las correcciones del celular, el correo y los formularios con los cambios posteriores de listados, stock, documentos y navegación.

## Version 1.0.32 (2026-10-23)

- Listados: el orden elegido en clientes y usuarios llega a la API. Los formularios muestran avisos en línea y las observaciones vacías de las órdenes se envían como dato opcional.

## Version 1.0.31 (2026-10-23)

- Órdenes y stock: los listados ordenan las filas visibles de inmediato, muestran el resultado de las acciones con claridad y actualizan los formularios de repuestos y movimientos.

## Version 1.0.30 (2026-10-23)

- Activos y catálogos: los listados ordenan las filas visibles de inmediato y confirman los cambios de estado; los formularios y filtros muestran errores más claros.

## Version 1.0.29 (2026-10-23)

- Tablas: el detalle de repuestos y los reportes permiten ordenar los movimientos, las órdenes y los grupos de datos; el detalle enlaza al historial completo.

## Version 1.0.28 (2026-10-23)

- Órdenes de trabajo: las órdenes asociadas se ordenan y paginan sin vaciar la tabla durante la carga; al asignar técnico se evita elegir al ya asignado.

## Version 1.0.27 (2026-10-23)

- Usuarios y clientes: los listados muestran y permiten ordenar por las órdenes asociadas; se mejoran las confirmaciones de baja y reactivación y los mensajes del alta de usuarios.

## Version 1.0.26 (2026-10-23)

- Avisos: los resultados y errores aparecen arriba con colores y mensajes accesibles; los errores duran más y los diálogos de confirmación tienen títulos identificables.

## Version 1.0.25 (2026-10-23)

- Desarrollo: el caché de compilación local persiste al recrear contenedores y se pueden precalentar las pantallas con una cuenta de prueba. Se amplía la prueba de ingreso rápido de stock.

## Version 1.0.24 (2026-10-23)

- Búsquedas: los selectores esperan el resultado remoto, descartan respuestas anteriores y avisan cuando falla la carga de opciones.

## Version 1.0.23 (2026-10-23)

- Navegación: se agrega una pantalla de inicio con accesos y órdenes recientes, se organiza el menú lateral y el pie muestra las versiones del frontend y la API.

## Version 1.0.22 (2026-10-23)

- Documentación: se pueden cargar, filtrar y editar documentos con título, tipo, descripción y asociación; también marcar su vigencia.

## Version 1.0.21 (2026-10-23)

- Stock: se puede ingresar stock desde el listado eligiendo repuesto y cantidad; la fecha y la ubicación se asignan automáticamente.

## Version 1.0.20 (2026-10-23)

- Listados: los valores numéricos de clientes, órdenes, repuestos y movimientos se muestran centrados en su columna.

## Version 1.0.19 (2026-10-23)

- Listados: se conserva visible la tabla anterior mientras se cargan filtros, orden o paginación, evitando el parpadeo.

## Version 1.0.18 (2026-10-23)

- Listados: se pueden ordenar las columnas de usuarios, clientes, máquinas, órdenes, repuestos y movimientos desde el encabezado, conservando filtros y paginación.

## Version 1.0.17 (2026-10-23)

- Formularios: los campos opcionales vacíos de repuestos y órdenes se envían como nulos para que la API los procese correctamente.

## Version 1.0.16 (2026-10-23)

- Pruebas: se actualizan las comprobaciones de reenvío de correo y los datos de teléfonos de los formularios para reflejar el comportamiento vigente.

## Version 1.0.15 (2026-10-23)

- Usuarios: el formulario acepta celulares con cero inicial y el alta muestra si el correo de Keycloak salió, falló o no correspondía; el reenvío muestra el error comunicado por la API.

## Version 1.0.14 (2026-10-23)

- Integración: se corrige el archivo de dependencias para que la instalación del frontend en Linux y en CI incluya todos los paquetes necesarios.

## Version 1.0.13 (2026-10-23)

- Seguridad: se actualizan Next.js y su configuración ESLint a 16.4.1 para corregir las vulnerabilidades detectadas por el análisis de dependencias del PR.

## Version 1.0.12 (2026-10-23)

- Seguridad: las páginas protegidas y públicas reciben una política de contenido con nonce por solicitud, compatible con el inicio y cierre de sesión de Keycloak.
- Pruebas: la comprobación del reenvío multipart utiliza el entorno de Node y las pruebas del layout reconocen el renderizado por solicitud.
