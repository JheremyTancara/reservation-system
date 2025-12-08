-- ============================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS
-- Sistema de Reservas de Restaurantes
-- ============================================
-- Fecha de última actualización: 7 de diciembre de 2025
-- Este script crea la base de datos completa con todos los restaurantes

-- ============================================
-- 1. CREAR BASE DE DATOS
-- ============================================
DROP DATABASE IF EXISTS `chatbot_reservas`;
CREATE DATABASE `chatbot_reservas`;
USE `chatbot_reservas`;

-- ============================================
-- 2. TABLA: restaurants (Restaurantes principales)
-- ============================================
CREATE TABLE `restaurants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` text,
  `puerto` int NOT NULL,
  `subdominio` varchar(50) NOT NULL,
  `activo` boolean DEFAULT true,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expire` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_puerto` (`puerto`),
  UNIQUE KEY `uk_subdominio` (`subdominio`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- 3. TABLA: port_manager (Gestor de puertos)
-- ============================================
CREATE TABLE `port_manager` (
  `id` int NOT NULL AUTO_INCREMENT,
  `puerto_inicio` int NOT NULL DEFAULT 3000,
  `puerto_actual` int NOT NULL DEFAULT 3000,
  `puertos_ocupados` json DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- 4. TABLA: branches (Sucursales)
-- ============================================
CREATE TABLE `branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` text,
  `restaurant_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `fk_branches_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- 5. TABLA: categorias (Categorías de menú)
-- ============================================
CREATE TABLE `categorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `restaurant_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `fk_categorias_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- 6. TABLA: menu_items (Ítems del menú)
-- ============================================
CREATE TABLE `menu_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `precio` decimal(10,2) NOT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `imagen_url` text,
  `branch_id` int NOT NULL,
  `restaurant_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `categoria_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `branch_id` (`branch_id`),
  KEY `restaurant_id` (`restaurant_id`),
  KEY `fk_categoria` (`categoria_id`),
  CONSTRAINT `fk_menu_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_menu_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_menu_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- 7. TABLA: mesas (Mesas)
-- ============================================
CREATE TABLE `mesas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero` int NOT NULL,
  `capacidad` int NOT NULL,
  `disponible` tinyint(1) DEFAULT '1',
  `branch_id` int DEFAULT NULL,
  `restaurant_id` int NOT NULL,
  `estado` varchar(20) DEFAULT 'disponible',
  PRIMARY KEY (`id`),
  KEY `branch_id` (`branch_id`),
  KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `fk_mesas_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mesas_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- 8. TABLA: reservas (Reservas)
-- ============================================
CREATE TABLE `reservas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_nombre` varchar(100) NOT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `personas` int NOT NULL,
  `estado` enum('pendiente','confirmada','cancelada') DEFAULT 'pendiente',
  `branch_id` int NOT NULL,
  `restaurant_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `mesa_id` int DEFAULT NULL,
  `total` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `branch_id` (`branch_id`),
  KEY `restaurant_id` (`restaurant_id`),
  KEY `mesa_id` (`mesa_id`),
  CONSTRAINT `fk_reservas_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reservas_mesa` FOREIGN KEY (`mesa_id`) REFERENCES `mesas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reservas_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- 9. TABLA: reserva_platos (Platos por reserva)
-- ============================================
CREATE TABLE `reserva_platos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reserva_id` int NOT NULL,
  `menu_item_id` int NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `branch_id` int NOT NULL,
  `restaurant_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `reserva_id` (`reserva_id`),
  KEY `menu_item_id` (`menu_item_id`),
  KEY `branch_id` (`branch_id`),
  KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `fk_reserva_platos_reserva` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reserva_platos_menu` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reserva_platos_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reserva_platos_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- 10. TABLA: messages (Mensajes del chatbot)
-- ============================================
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `from_number` varchar(20) DEFAULT NULL,
  `to_number` varchar(20) DEFAULT NULL,
  `content` text,
  `tipo` enum('pregunta','respuesta','sistema') DEFAULT 'sistema',
  `branch_id` int DEFAULT NULL,
  `restaurant_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `branch_id` (`branch_id`),
  KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `fk_messages_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_messages_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- INSERCIÓN DE DATOS INICIALES
-- ============================================

-- ============================================
-- GESTOR DE PUERTOS
-- ============================================
INSERT INTO `port_manager` (`id`, `puerto_inicio`, `puerto_actual`, `puertos_ocupados`) VALUES
(1, 3000, 3002, JSON_ARRAY(3001, 3002));

-- ============================================
-- RESTAURANTES PRINCIPALES
-- ============================================
-- Incluye: Gus Restaurant Group y Pizza Palace
INSERT INTO `restaurants` (`id`, `nombre`, `email`, `password`, `telefono`, `direccion`, `puerto`, `subdominio`, `activo`, `created_at`) VALUES
(1, 'Gus Restaurant Group', 'admin@gusrestaurant.com', 'admin123', '70123456', 'Av. Principal 100', 3001, 'gus-main', 1, '2025-06-29 10:00:00'),
(2, 'Pizza Palace', 'admin@pizzapalace.com', 'admin321', '70234567', 'Calle Comercio 200', 3002, 'pizza-palace', 1, '2025-06-29 10:15:00');

-- ============================================
-- SUCURSALES
-- ============================================
INSERT INTO `branches` (`id`, `nombre`, `email`, `telefono`, `direccion`, `restaurant_id`, `created_at`) VALUES
(1, 'Gus Restobar Quillacollo', 'quillacollo@gusrestaurant.com', '777888999', 'Av. Principal 123', 1, '2025-04-18 14:29:06'),
(2, 'Gus Restobar America', 'america@gusrestaurant.com', '70740632', 'Av. America', 1, '2025-04-20 14:12:43'),
(3, 'Gus Restobar Centro', 'centro@gusrestaurant.com', '78912345', 'Av. Central #100', 1, '2025-04-20 14:21:19'),
(4, 'Pizza Palace Norte', 'norte@pizzapalace.com', '78500001', 'Av. Norte #200', 2, '2025-04-20 14:21:19'),
(5, 'Pizza Palace Sur', 'sur@pizzapalace.com', '78611122', 'Av. Sur #300', 2, '2025-04-20 14:21:19');

-- ============================================
-- CATEGORÍAS
-- ============================================
INSERT INTO `categorias` (`id`, `nombre`, `restaurant_id`) VALUES
(1, 'Bebidas', 1),
(2, 'Combos', 1),
(3, 'Platos Especiales', 1),
(4, 'Pizzas', 2),
(5, 'Bebidas', 2);

-- ============================================
-- ITEMS DEL MENÚ
-- ============================================
INSERT INTO `menu_items` (`id`, `nombre`, `descripcion`, `precio`, `categoria`, `imagen_url`, `branch_id`, `restaurant_id`, `created_at`, `categoria_id`) VALUES
(8, 'Combo alitas', 'promo alitas', 38.00, NULL, 'https://backend-swqp.onrender.com/uploads/1746458549866.jpg', 3, 1, '2025-05-05 15:22:38', 2),
(12, 'Promocion alitas', 'platos especiales', 38.00, NULL, 'https://backend-swqp.onrender.com/uploads/1746637895731.jpg', 3, 1, '2025-05-07 17:11:57', 3),
(17, 'Promo Burguer', 'Promo Burguer 2x35', 35.00, NULL, 'https://res.cloudinary.com/defwxebhk/image/upload/v1746681146/menu/fxruhv9enjcdnhvxj2qp.jpg', 1, 1, '2025-05-08 05:12:52', 2),
(18, 'Promo Alitas', 'Promo Alitas 12 alitas por 38Bs', 38.00, NULL, 'https://res.cloudinary.com/defwxebhk/image/upload/v1746681198/menu/awxbrvxmrbnefkwcit4n.jpg', 1, 1, '2025-05-08 05:13:39', 2),
(19, 'Coca Cola de 2lt', 'Coca Cola de 2Lt', 12.00, NULL, 'https://res.cloudinary.com/defwxebhk/image/upload/v1746681454/menu/zqbk7po9oq9m8c9qbdsc.png', 1, 1, '2025-05-08 05:17:43', 1),
(20, 'Coca Cola de 300ml', 'Coca cola pequeña de 300ml', 5.00, NULL, 'https://res.cloudinary.com/defwxebhk/image/upload/v1746681497/menu/aa9wuzixfos3kot4wdi4.png', 1, 1, '2025-05-08 05:18:25', 1),
(21, 'Sprite de 500ml', 'Bebida Sprite de 500ml', 6.00, NULL, 'https://res.cloudinary.com/defwxebhk/image/upload/v1746681529/menu/imkodpqaqd0raacbpdl9.png', 1, 1, '2025-05-08 05:19:18', 1);

-- ============================================
-- MESAS
-- ============================================
INSERT INTO `mesas` (`id`, `numero`, `capacidad`, `disponible`, `branch_id`, `restaurant_id`, `estado`) VALUES
(1, 1, 4, 1, 1, 1, 'disponible'),
(2, 2, 4, 1, 1, 1, 'ocupada'),
(3, 3, 2, 1, 1, 1, 'disponible'),
(4, 1, 4, 1, 2, 1, 'disponible'),
(5, 2, 2, 1, 2, 1, 'disponible'),
(6, 1, 6, 1, 4, 2, 'disponible');

-- ============================================
-- RESERVAS DE EJEMPLO
-- ============================================
INSERT INTO `reservas` (`id`, `cliente_nombre`, `fecha`, `hora`, `personas`, `estado`, `branch_id`, `restaurant_id`, `created_at`, `mesa_id`, `total`) VALUES
(63, 'Rodrigo Huanca Maldonado', '2025-05-25', '16:00:00', 2, 'confirmada', 1, 1, '2025-05-08 05:28:17', 2, 41.00);

-- ============================================
-- PLATOS DE LA RESERVA
-- ============================================
INSERT INTO `reserva_platos` (`id`, `reserva_id`, `menu_item_id`, `nombre`, `precio`, `branch_id`, `restaurant_id`) VALUES
(9, 63, 17, 'Promo Burguer', 35.00, 1, 1),
(10, 63, 21, 'Sprite de 500ml', 6.00, 1, 1);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Base de datos creada exitosamente con:
-- ✓ 2 Restaurantes (Gus Restaurant Group, Pizza Palace)
-- ✓ 5 Sucursales
-- ✓ 5 Categorías
-- ✓ 7 Items del menú
-- ✓ 6 Mesas
-- ✓ 1 Reserva de ejemplo
-- ============================================

SELECT 'Base de datos creada exitosamente!' as Mensaje;
SELECT COUNT(*) as 'Total Restaurantes' FROM restaurants;
SELECT COUNT(*) as 'Total Sucursales' FROM branches;
SELECT COUNT(*) as 'Total Items Menu' FROM menu_items;
