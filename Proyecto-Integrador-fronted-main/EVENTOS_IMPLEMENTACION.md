# Sistema de Eventos con URLs Reales

## 📋 Resumen de Implementación

Este proyecto ahora integra completamente los datos reales de scrapers para mostrar eventos con URLs funcionales que redirigen a las páginas oficiales de cada evento.

## 🎯 Funcionalidades Implementadas

### 1. **Eventos Destacados**
- Muestra eventos reales extraídos de `scrapers/scrapers.json`
- Cada tarjeta es **clickeable** y abre la URL real del evento en una nueva pestaña
- Se muestran los primeros 3 eventos de cada ciudad disponible

### 2. **Sistema de Búsqueda Avanzado**
Los usuarios pueden filtrar eventos por:
- **Ciudad**: Medellín, Bogotá, Cali, Bucaramanga
- **Categoría**: Deportes, Música, Teatro, Culturales, Conciertos
- **Fecha**: Selector de fecha específica
- **Término de búsqueda**: Búsqueda libre por nombre, descripción, lugar, etc.

### 3. **Sección "Más Eventos"**
- Muestra eventos adicionales (hasta 12 por defecto)
- Se actualiza dinámicamente según los filtros aplicados
- Incluye botón "Limpiar Filtros" para resetear la búsqueda
- Mensaje amigable cuando no hay resultados

### 4. **Tarjetas de Eventos Interactivas**
Cada tarjeta muestra:
- Nombre del evento
- Categoría (con badge estilizado)
- Ciudad
- Fecha formateada
- **Click directo** para abrir la URL del evento

### 5. **Panel de Detalles**
Si un evento no tiene URL, se abre un panel lateral con:
- Información completa del evento
- Ciudad y lugar
- Fecha y hora
- Descripción
- Tipo de ingreso (Gratis/Costo)
- Botón "Ir al Evento" (si hay URL disponible)

## 📁 Archivos Principales Modificados/Creados

### Nuevos Archivos

#### `src/utils/eventsUtils.js`
Utilidades para manejar los datos de eventos:
- `getAllEvents()`: Obtiene todos los eventos en array plano
- `getCities()`: Retorna lista de ciudades únicas
- `getCategories()`: Retorna lista de categorías únicas
- `filterEvents(filters)`: Filtra eventos por ciudad, categoría, fecha y término de búsqueda
- `getFeaturedEvents(count)`: Obtiene eventos destacados
- `formatDate(dateString)`: Formatea fechas al español
- `openEventURL(url)`: Abre URLs en nueva pestaña con seguridad

### Archivos Modificados

#### `src/pages/principal.jsx`
- Importa utilidades de eventos
- Implementa estados para filtros y eventos
- Maneja búsqueda y filtrado en tiempo real
- Renderiza eventos dinámicamente desde JSON
- Click handlers para abrir URLs reales

#### `src/components/ChatBotLogic.jsx`
- Actualizado para importar desde `src/data/scrapers.json` (fuente correcta)
- Mantiene toda la funcionalidad del chatbot conversacional

#### `src/styles/principal.css`
- Mejorado diseño de tarjetas de eventos
- Añadido gradiente overlay para mejor legibilidad
- Badges para categorías
- Botón de búsqueda con ícono de lupa
- Efectos hover mejorados
- Diseño responsive

## 🔧 Cómo Funciona

### 1. Carga Inicial
```javascript
useEffect(() => {
  setAllCities(getCities());           // Carga ciudades disponibles
  setAllCategories(getCategories());   // Carga categorías disponibles
  setEventosDestacados(getFeaturedEvents(3));  // Carga 3 eventos destacados
  // Carga eventos adicionales (excluyendo destacados)
}, []);
```

### 2. Filtrado de Eventos
```javascript
const handleSearch = () => {
  const filtered = filterEvents(filters);  // Aplica filtros
  setMasEventos(filtered);                 // Actualiza vista
  setHasSearched(true);                    // Marca que se realizó búsqueda
};
```

### 3. Click en Evento
```javascript
const handleEventClick = (evento) => {
  if (evento.url) {
    openEventURL(evento.url);  // Abre URL en nueva pestaña
  } else {
    setEventoActivo(evento);   // Muestra panel de detalles
  }
};
```

## 📊 Estructura de Datos

Los eventos provienen de `scrapers/scrapers.json` con la siguiente estructura:

```json
[
  {
    "ciudad": "Medellín",
    "categoria": "Música",
    "eventos": [
      {
        "nombre": "Ritvales 2025",
        "fecha": "2025-11-01",
        "hora": "2:00 p.m.",
        "lugar": "Parque Norte",
        "descripcion": "Festival de música electrónica...",
        "ingreso": "Costo",
        "url": "https://ticketlive.com.co/..."
      }
    ]
  }
]
```

## 🎨 Experiencia de Usuario

### Flujo de Búsqueda
1. Usuario selecciona filtros (ciudad, categoría, fecha)
2. Usuario escribe término de búsqueda (opcional)
3. Click en "🔍 Buscar"
4. Resultados se actualizan inmediatamente
5. Click en cualquier evento abre su URL oficial

### Indicadores Visuales
- ✅ Eventos con URL: Click directo (cursor pointer)
- 📋 Eventos sin URL: Abre panel de detalles
- 🔴 Sin resultados: Mensaje amigable con sugerencias
- 🔄 Botón "Limpiar Filtros": Resetea búsqueda

## 🚀 Próximas Mejoras Sugeridas

1. **Paginación**: Implementar carga de más eventos (lazy loading)
2. **Favoritos**: Permitir guardar eventos favoritos
3. **Compartir**: Botón para compartir evento en redes sociales
4. **Calendario**: Integración con Google Calendar / iCal
5. **Notificaciones**: Alertas de eventos próximos
6. **Mapa**: Mostrar ubicación del evento en mapa interactivo

## 📱 Responsive Design

El diseño es completamente responsive:
- **Desktop**: Grid de 3-4 columnas
- **Tablet**: Grid de 2 columnas
- **Mobile**: Grid de 1 columna
- Tarjetas adaptan su tamaño automáticamente

## 🔒 Seguridad

- URLs abiertas con `rel="noopener noreferrer"` para prevenir ataques
- Validación de datos antes de renderizar
- Sanitización de inputs de búsqueda

## 📝 Notas Importantes

1. **Fuente de Datos**: El sistema usa `src/data/scrapers.json` como fuente única de verdad
2. **URLs Reales**: Todas las URLs provienen directamente de los scrapers (validadas)
3. **Sin Backend**: Todo funciona del lado del cliente (JSON estático)
4. **ChatBot**: El chatbot sigue funcionando con los mismos datos

## 🎉 Resultado Final

Los usuarios ahora pueden:
- ✅ Buscar eventos por ciudad (ej: "Medellín Deportes" → muestra todos los eventos deportivos de Medellín)
- ✅ Filtrar por categoría y fecha
- ✅ Hacer click en cualquier evento y ser redirigidos a la página oficial
- ✅ Ver información detallada antes de ir al sitio externo
- ✅ Navegar de forma intuitiva y rápida

---

**Desarrollado con ❤️ para mejorar la experiencia de descubrimiento de eventos**
