# Estos IDs son falsos para poder ir probando el módulo Analytics

## IDs de Platos de Prueba

| # | platoId                    | Nombre del Plato        | Precio  |
|---|----------------------------|-------------------------|---------|
| 1 | 684a1f2e3b0c5d7e9f123401   | Tacos de Res            | Q 45.00 |
| 2 | 684a1f2e3b0c5d7e9f123402   | Pizza Margherita        | Q 85.00 |
| 3 | 684a1f2e3b0c5d7e9f123403   | Sopa de Mariscos        | Q 95.00 |
| 4 | 684a1f2e3b0c5d7e9f123404   | Ensalada César          | Q 55.00 |
| 5 | 684a1f2e3b0c5d7e9f123405   | Pastel de Chocolate     | Q 35.00 |

## IDs de Restaurantes de Prueba

| # | restauranteId              | Nombre                   |
|---|----------------------------|--------------------------|
| 1 | 784b2a3f4c1d6e8f0a234501   | La Fogata Gourmet        |
| 2 | 784b2a3f4c1d6e8f0a234502   | El Rincón del Sabor      |

## IDs de Usuarios de Prueba 

| # | usuarioId      | Nombre          |
|---|----------------|-----------------|
| 1 | usr_001        | Carlos Mejía    |
| 2 | usr_002        | María González  |
| 3 | usr_003        | Roberto Lima    |

## Notas para el equipo

- El campo que identifica el plato en Reviews es: `platoId`
- El campo que identifica el restaurante es: `restauranteId`  
- El campo del usuario es: `usuarioId` (string del ID de PostgreSQL)
- Joshua debe usar estos mismos ObjectIds en su seed de menu cuando haga el CRUD real
- Rango de rating: 1 (muy malo) a 5 (excelente)