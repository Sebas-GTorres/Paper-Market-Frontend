# Papelería Fundadores — Frontend

Sistema de gestión y e-commerce para Papelería Fundadores. Construido con **Angular 22**, **Tailwind CSS v4** y conectado a un backend **Spring Boot 3.4.2**.

---

## Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| Angular | 22 | Framework principal |
| Tailwind CSS | 4 | Estilos y diseño |
| TypeScript | 5.x | Lenguaje |
| RxJS | 7.x | Manejo de streams y HTTP |
| Lucide Icons | SVG inline | Iconografía |
| Angular Signals | nativo | Estado reactivo |

---

## Requisitos previos

- Node.js 18 o superior
- npm 9 o superior
- Backend Spring Boot corriendo en `http://localhost:8080`

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Sebas-GTorres/Paper-Market-Frontend
cd Paper-Market-Frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm start
```

La aplicación queda disponible en `http://localhost:4200`.

> **Nota:** El backend debe estar corriendo antes de usar la aplicación. Ver repositorio del backend para instrucciones.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # AuthGuard, RoleGuard, RedirectIfLoggedGuard
│   │   ├── interceptors/    # JWT interceptor (adjunta token y maneja 401/403)
│   │   ├── models/          # Interfaces TypeScript de todos los modelos
│   │   └── services/        # AuthService, ProductService, OrderService, etc.
│   ├── features/
│   │   ├── auth/            # Login, Registro, Recuperar contraseña
│   │   ├── client/          # Catálogo, Carrito, Checkout, Mis Pedidos
│   │   ├── employee/        # Pedidos, POS, Inventario
│   │   ├── admin/           # Dashboard, Usuarios, Productos, Ventas, etc.
│   │   └── shared/          # Mi Perfil (compartido entre roles)
│   └── shared/
│       ├── components/      # Toast, Modal, Skeleton, Breadcrumb, IconComponent
│       ├── pipes/           # DateEsPipe (fecha en español), CurrencyСoPipe (COP)
│       └── utils/           # Extractor de errores de API
└── environments/            # environment.ts con URL base del backend
```

---

## Roles y acceso

El sistema tiene 3 roles. El rol se lee del token JWT al iniciar sesión y determina la interfaz que se muestra.

| Rol | Ruta principal | Acceso |
|---|---|---|
| `ADMIN` | `/admin/dashboard` | Acceso total al sistema |
| `EMPLEADO` | `/employee/orders` | Pedidos, POS, Inventario |
| `CLIENTE` | `/client/catalog` | Catálogo, Carrito, Mis Pedidos |

---

## Módulos principales

### Autenticación
- Login con JWT
- Registro de clientes (público)
- Recuperar y restablecer contraseña
- Guards por rol en todas las rutas protegidas

### Vista Cliente
- Catálogo con búsqueda, filtro por categoría y filtro por marca (client-side)
- Carrito de compras con cálculo de IVA (19%)
- Checkout con dirección y método de pago
- Historial de pedidos con opción de cancelar

### Vista Empleado
- Gestión de pedidos con cambio de estado
- Punto de Venta (POS) con búsqueda de productos y clientes
- Inventario con alertas de stock bajo

### Vista Admin
- Dashboard con KPIs derivados de los endpoints existentes
- CRUD completo de: Usuarios, Roles, Productos, Categorías, Proveedores, Clientes
- Registro de compras a proveedores
- Historial de ventas
- Gestión de pedidos

---

## Variables de entorno

El archivo `src/environments/environment.ts` contiene la URL del backend:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1'
};
```

Cambia `apiUrl` si el backend corre en otro host o puerto.

---

## CORS

El backend debe permitir peticiones desde `http://localhost:4200`. Agrega esta configuración en Spring Boot:

```java
// src/main/java/.../config/CorsConfig.java
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200"));
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Servidor de desarrollo en `http://localhost:4200` |
| `npm run build` | Build de producción en `dist/` |

---

## Repositorio del backend

[Papelería Fundadores — Backend]()
