-- ---------------------------------------------------------------------------
-- Smart Marketplace - MySQL schema
--
-- Generated from the Laravel migrations in backend/database/migrations
-- (Laravel 13.34 / PHP 8.5). Target: MySQL 8.0+ / MariaDB 10.6+.
--
-- Charset: utf8mb4 / utf8mb4_unicode_ci, engine InnoDB.
-- Statements are ordered to satisfy foreign key dependencies.
--
-- Regenerate by running the migrations against MySQL:
--   php artisan migrate:fresh
-- ---------------------------------------------------------------------------

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified_at` TIMESTAMP NULL,
    `password` VARCHAR(255) NOT NULL,
    `remember_token` VARCHAR(100) NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users` ADD UNIQUE `users_email_unique`(`email`);

CREATE TABLE `password_reset_tokens` (
    `email` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NULL,
    PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `payload` LONGTEXT NOT NULL,
    `last_activity` INT NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `sessions` ADD INDEX `sessions_user_id_index`(`user_id`);

ALTER TABLE `sessions` ADD INDEX `sessions_last_activity_index`(`last_activity`);

CREATE TABLE `cache` (
    `key` VARCHAR(255) NOT NULL,
    `value` MEDIUMTEXT NOT NULL,
    `expiration` BIGINT NOT NULL,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `cache` ADD INDEX `cache_expiration_index`(`expiration`);

CREATE TABLE `cache_locks` (
    `key` VARCHAR(255) NOT NULL,
    `owner` VARCHAR(255) NOT NULL,
    `expiration` BIGINT NOT NULL,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `cache_locks` ADD INDEX `cache_locks_expiration_index`(`expiration`);

CREATE TABLE `jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `queue` VARCHAR(255) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `attempts` SMALLINT UNSIGNED NOT NULL,
    `reserved_at` INT UNSIGNED NULL,
    `available_at` INT UNSIGNED NOT NULL,
    `created_at` INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `jobs` ADD INDEX `jobs_queue_index`(`queue`);

CREATE TABLE `job_batches` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `total_jobs` INT NOT NULL,
    `pending_jobs` INT NOT NULL,
    `failed_jobs` INT NOT NULL,
    `failed_job_ids` LONGTEXT NOT NULL,
    `options` MEDIUMTEXT NULL,
    `cancelled_at` INT NULL,
    `created_at` INT NOT NULL,
    `finished_at` INT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `failed_jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `uuid` VARCHAR(255) NOT NULL,
    `connection` VARCHAR(255) NOT NULL,
    `queue` VARCHAR(255) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `exception` LONGTEXT NOT NULL,
    `failed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `failed_jobs` ADD INDEX `failed_jobs_connection_queue_failed_at_index`(`connection`, `queue`, `failed_at`);

ALTER TABLE `failed_jobs` ADD UNIQUE `failed_jobs_uuid_unique`(`uuid`);

ALTER TABLE `users` ADD `phone` VARCHAR(255) NULL AFTER `email`;

ALTER TABLE `users` ADD `is_active` TINYINT(1) NOT NULL DEFAULT '1' AFTER `password`;

ALTER TABLE `users` ADD UNIQUE `users_phone_unique`(`phone`);

CREATE TABLE `vendors` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `store_name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `commission_rate` DECIMAL(5, 2) NOT NULL DEFAULT '0',
    `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `vendors` ADD CONSTRAINT `vendors_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `vendors` ADD INDEX `vendors_status_index`(`status`);

ALTER TABLE `vendors` ADD UNIQUE `vendors_slug_unique`(`slug`);

CREATE TABLE `addresses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NULL,
    `province` VARCHAR(255) NOT NULL,
    `city` VARCHAR(255) NOT NULL,
    `postal_code` VARCHAR(255) NULL,
    `address_line` VARCHAR(255) NOT NULL,
    `recipient_name` VARCHAR(255) NOT NULL,
    `recipient_phone` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `addresses` ADD CONSTRAINT `addresses_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

CREATE TABLE `categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `parent_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

ALTER TABLE `categories` ADD UNIQUE `categories_slug_unique`(`slug`);

CREATE TABLE `products` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `ai_generated_description` TEXT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT '1',
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `products` ADD CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT;

ALTER TABLE `products` ADD INDEX `products_category_id_is_active_index`(`category_id`, `is_active`);

ALTER TABLE `products` ADD UNIQUE `products_slug_unique`(`slug`);

CREATE TABLE `attributes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `attributes` ADD UNIQUE `attributes_name_unique`(`name`);

CREATE TABLE `attribute_values` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `attribute_id` BIGINT UNSIGNED NOT NULL,
    `value` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `attribute_values` ADD CONSTRAINT `attribute_values_attribute_id_foreign` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE CASCADE;

ALTER TABLE `attribute_values` ADD UNIQUE `attribute_values_attribute_id_value_unique`(`attribute_id`, `value`);

CREATE TABLE `product_variants` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `sku` VARCHAR(255) NOT NULL,
    `barcode` VARCHAR(255) NULL,
    `weight_grams` INT UNSIGNED NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

ALTER TABLE `product_variants` ADD UNIQUE `product_variants_sku_unique`(`sku`);

ALTER TABLE `product_variants` ADD INDEX `product_variants_barcode_index`(`barcode`);

CREATE TABLE `variant_attribute_values` (
    `variant_id` BIGINT UNSIGNED NOT NULL,
    `attribute_value_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`variant_id`, `attribute_value_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `variant_attribute_values` ADD CONSTRAINT `variant_attribute_values_variant_id_foreign` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE;

ALTER TABLE `variant_attribute_values` ADD CONSTRAINT `variant_attribute_values_attribute_value_id_foreign` FOREIGN KEY (`attribute_value_id`) REFERENCES `attribute_values` (`id`) ON DELETE CASCADE;

CREATE TABLE `vendor_inventories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `vendor_id` BIGINT UNSIGNED NOT NULL,
    `variant_id` BIGINT UNSIGNED NOT NULL,
    `price` DECIMAL(14, 2) NOT NULL,
    `sale_price` DECIMAL(14, 2) NULL,
    `quantity` INT UNSIGNED NOT NULL DEFAULT '0',
    `reserved_quantity` INT UNSIGNED NOT NULL DEFAULT '0',
    `is_available` TINYINT(1) NOT NULL DEFAULT '1',
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `vendor_inventories` ADD CONSTRAINT `vendor_inventories_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

ALTER TABLE `vendor_inventories` ADD CONSTRAINT `vendor_inventories_variant_id_foreign` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE;

ALTER TABLE `vendor_inventories` ADD UNIQUE `vendor_inventories_vendor_id_variant_id_unique`(`vendor_id`, `variant_id`);

ALTER TABLE `vendor_inventories` ADD INDEX `vendor_inventories_variant_id_is_available_index`(`variant_id`, `is_available`);

CREATE TABLE `inventory_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `vendor_inventory_id` BIGINT UNSIGNED NOT NULL,
    `order_item_id` BIGINT UNSIGNED NULL,
    `change_quantity` INT NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `note` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `inventory_logs` ADD CONSTRAINT `inventory_logs_vendor_inventory_id_foreign` FOREIGN KEY (`vendor_inventory_id`) REFERENCES `vendor_inventories` (`id`) ON DELETE CASCADE;

ALTER TABLE `inventory_logs` ADD INDEX `inventory_logs_order_item_id_index`(`order_item_id`);

CREATE TABLE `carts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NULL,
    `session_id` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `carts` ADD CONSTRAINT `carts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `carts` ADD INDEX `carts_session_id_index`(`session_id`);

CREATE TABLE `cart_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `cart_id` BIGINT UNSIGNED NOT NULL,
    `vendor_inventory_id` BIGINT UNSIGNED NOT NULL,
    `quantity` INT UNSIGNED NOT NULL DEFAULT '1',
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_cart_id_foreign` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE;

ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_vendor_inventory_id_foreign` FOREIGN KEY (`vendor_inventory_id`) REFERENCES `vendor_inventories` (`id`) ON DELETE CASCADE;

ALTER TABLE `cart_items` ADD UNIQUE `cart_items_cart_id_vendor_inventory_id_unique`(`cart_id`, `vendor_inventory_id`);

CREATE TABLE `orders` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `order_number` VARCHAR(255) NOT NULL,
    `shipping_address_snapshot` JSON NOT NULL,
    `total_items_price` DECIMAL(14, 2) NOT NULL DEFAULT '0',
    `total_shipping_fee` DECIMAL(14, 2) NOT NULL DEFAULT '0',
    `grand_total` DECIMAL(14, 2) NOT NULL DEFAULT '0',
    `payment_status` VARCHAR(255) NOT NULL DEFAULT 'pending',
    `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT;

ALTER TABLE `orders` ADD INDEX `orders_payment_status_index`(`payment_status`);

ALTER TABLE `orders` ADD INDEX `orders_status_index`(`status`);

ALTER TABLE `orders` ADD UNIQUE `orders_order_number_unique`(`order_number`);

CREATE TABLE `sub_orders` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `vendor_id` BIGINT UNSIGNED NOT NULL,
    `sub_order_number` VARCHAR(255) NOT NULL,
    `subtotal_price` DECIMAL(14, 2) NOT NULL DEFAULT '0',
    `shipping_fee` DECIMAL(14, 2) NOT NULL DEFAULT '0',
    `commission_rate` DECIMAL(5, 2) NOT NULL DEFAULT '0',
    `commission_amount` DECIMAL(14, 2) NOT NULL DEFAULT '0',
    `vendor_net_amount` DECIMAL(14, 2) NOT NULL DEFAULT '0',
    `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `sub_orders` ADD CONSTRAINT `sub_orders_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

ALTER TABLE `sub_orders` ADD CONSTRAINT `sub_orders_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT;

ALTER TABLE `sub_orders` ADD INDEX `sub_orders_status_index`(`status`);

ALTER TABLE `sub_orders` ADD UNIQUE `sub_orders_sub_order_number_unique`(`sub_order_number`);

CREATE TABLE `order_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `sub_order_id` BIGINT UNSIGNED NOT NULL,
    `vendor_inventory_id` BIGINT UNSIGNED NULL,
    `product_name_snapshot` VARCHAR(255) NOT NULL,
    `variant_sku_snapshot` VARCHAR(255) NOT NULL,
    `selected_attributes_snapshot` JSON NULL,
    `unit_price` DECIMAL(14, 2) NOT NULL,
    `quantity` INT UNSIGNED NOT NULL,
    `total_price` DECIMAL(14, 2) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `order_items` ADD CONSTRAINT `order_items_sub_order_id_foreign` FOREIGN KEY (`sub_order_id`) REFERENCES `sub_orders` (`id`) ON DELETE CASCADE;

ALTER TABLE `order_items` ADD CONSTRAINT `order_items_vendor_inventory_id_foreign` FOREIGN KEY (`vendor_inventory_id`) REFERENCES `vendor_inventories` (`id`) ON DELETE SET NULL;

CREATE TABLE `order_status_histories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `sub_order_id` BIGINT UNSIGNED NOT NULL,
    `from_status` VARCHAR(255) NULL,
    `to_status` VARCHAR(255) NOT NULL,
    `changed_by_user_id` BIGINT UNSIGNED NULL,
    `note` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `order_status_histories` ADD CONSTRAINT `order_status_histories_sub_order_id_foreign` FOREIGN KEY (`sub_order_id`) REFERENCES `sub_orders` (`id`) ON DELETE CASCADE;

ALTER TABLE `order_status_histories` ADD CONSTRAINT `order_status_histories_changed_by_user_id_foreign` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

CREATE TABLE `payments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `gateway_name` VARCHAR(255) NOT NULL,
    `transaction_id` VARCHAR(255) NULL,
    `reference_id` VARCHAR(255) NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
    `paid_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

ALTER TABLE `payments` ADD INDEX `payments_status_index`(`status`);

ALTER TABLE `payments` ADD UNIQUE `payments_transaction_id_unique`(`transaction_id`);

ALTER TABLE `payments` ADD INDEX `payments_reference_id_index`(`reference_id`);

CREATE TABLE `shipments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `sub_order_id` BIGINT UNSIGNED NOT NULL,
    `courier_name` VARCHAR(255) NULL,
    `tracking_code` VARCHAR(255) NULL,
    `shipped_at` TIMESTAMP NULL,
    `delivered_at` TIMESTAMP NULL,
    `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `shipments` ADD CONSTRAINT `shipments_sub_order_id_foreign` FOREIGN KEY (`sub_order_id`) REFERENCES `sub_orders` (`id`) ON DELETE CASCADE;

ALTER TABLE `shipments` ADD INDEX `shipments_tracking_code_index`(`tracking_code`);

CREATE TABLE `vendor_payouts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `vendor_id` BIGINT UNSIGNED NOT NULL,
    `sub_order_id` BIGINT UNSIGNED NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
    `payout_reference` VARCHAR(255) NULL,
    `paid_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `vendor_payouts` ADD CONSTRAINT `vendor_payouts_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT;

ALTER TABLE `vendor_payouts` ADD CONSTRAINT `vendor_payouts_sub_order_id_foreign` FOREIGN KEY (`sub_order_id`) REFERENCES `sub_orders` (`id`) ON DELETE CASCADE;

ALTER TABLE `vendor_payouts` ADD INDEX `vendor_payouts_status_index`(`status`);

CREATE TABLE `product_reviews` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `order_item_id` BIGINT UNSIGNED NOT NULL,
    `rating` TINYINT UNSIGNED NOT NULL,
    `comment` TEXT NULL,
    `ai_sentiment` VARCHAR(255) NULL,
    `ai_sentiment_score` DECIMAL(5, 4) NULL,
    `is_approved` TINYINT(1) NOT NULL DEFAULT '0',
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `product_reviews` ADD CONSTRAINT `product_reviews_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

ALTER TABLE `product_reviews` ADD CONSTRAINT `product_reviews_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `product_reviews` ADD CONSTRAINT `product_reviews_order_item_id_foreign` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE;

ALTER TABLE `product_reviews` ADD INDEX `product_reviews_product_id_is_approved_index`(`product_id`, `is_approved`);

ALTER TABLE `product_reviews` ADD UNIQUE `product_reviews_order_item_id_unique`(`order_item_id`);

CREATE TABLE `ai_jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `job_type` VARCHAR(255) NOT NULL,
    `target_entity_type` VARCHAR(255) NOT NULL,
    `target_entity_id` BIGINT UNSIGNED NOT NULL,
    `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
    `error_message` TEXT NULL,
    `completed_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `ai_jobs` ADD INDEX `ai_jobs_target_entity_type_target_entity_id_index`(`target_entity_type`, `target_entity_id`);

ALTER TABLE `ai_jobs` ADD INDEX `ai_jobs_status_index`(`status`);

-- ---------------------------------------------------------------------------
-- End of schema
-- ---------------------------------------------------------------------------
