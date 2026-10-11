# Database ERD

Derived from `backend/database/migrations` (including `2026_10_10_000001`, `2026_10_10_000002`, `2026_10_10_000003` and the Sanctum `personal_access_tokens` migration).
Framework tables (`password_reset_tokens`, `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, `migrations`) are omitted.

```mermaid
erDiagram
    users ||--o{ vendors : "owns"
    users ||--o{ addresses : "has"
    users ||--o{ carts : "has"
    users ||--o{ orders : "places"
    users ||--o{ product_reviews : "writes"
    users ||--o{ order_status_histories : "changed_by"
    users ||--o{ order_histories : "changed_by"
    users ||--o{ refunds : "requested_by"
    users ||--o{ personal_access_tokens : "authenticates_with"

    vendors ||--o{ products : "submits"
    vendors ||--o{ vendor_inventories : "offers"
    vendors ||--o{ sub_orders : "fulfills"
    vendors ||--o{ vendor_payouts : "receives"
    vendors ||--o{ coupons : "issues"
    vendors ||--o{ shipping_methods : "defines"
    warranties ||--o{ vendor_inventories : "covers"

    categories ||--o{ categories : "parent"
    categories ||--o{ products : "contains"
    brands ||--o{ products : "brands"
    products ||--o{ product_variants : "has"
    products ||--o{ product_images : "has"
    products ||--o{ product_reviews : "reviewed_in"
    product_variants ||--o{ product_images : "shown_in"
    product_variants ||--o{ vendor_inventories : "stocked_as"
    product_variants ||--o{ variant_attribute_values : "described_by"

    attributes ||--o{ attribute_values : "has"
    attribute_values ||--o{ variant_attribute_values : "used_in"

    vendor_inventories ||--o{ inventory_logs : "logs"
    vendor_inventories ||--o{ cart_items : "added_as"
    vendor_inventories ||--o{ order_items : "sold_as"
    vendor_inventories ||--o{ inventory_reservations : "reserved_by"
    carts ||--o{ inventory_reservations : "held_for"
    orders ||--o{ inventory_reservations : "held_for"
    order_items ||--o{ inventory_logs : "causes"
    order_items ||--o| product_reviews : "reviewed_by"

    carts ||--o{ cart_items : "contains"

    coupons ||--o{ orders : "applied_to"
    orders ||--o{ sub_orders : "splits_into"
    orders ||--o{ payments : "paid_by"
    orders ||--o{ order_histories : "history"
    shipping_methods ||--o{ sub_orders : "used_by"
    sub_orders ||--o{ order_items : "contains"
    sub_orders ||--o{ order_status_histories : "history"
    sub_orders ||--o{ shipments : "shipped_as"
    sub_orders ||--o{ vendor_payouts : "settled_by"
    sub_orders ||--o{ refunds : "refunded_in"
    payments ||--o{ refunds : "refunded_by"
    payout_batches ||--o{ vendor_payouts : "groups"

    users {
        bigint id PK
        string name
        string email UK
        string phone UK
        string password
        string role "customer|vendor|admin"
        boolean is_active
        timestamp email_verified_at
        string remember_token
        timestamps timestamps
    }
    personal_access_tokens {
        bigint id PK
        string tokenable_type "morph"
        bigint tokenable_id FK,morph
        text name
        string token UK "sha256 hash"
        text abilities
        timestamp last_used_at
        timestamp expires_at
        timestamps timestamps
    }
    vendors {
        bigint id PK
        bigint user_id FK
        string store_name
        string slug UK
        decimal commission_rate
        string bank_sheba
        string status "pending|approved|suspended|rejected"
        timestamp approved_at
        timestamps timestamps
        timestamp deleted_at
    }
    addresses {
        bigint id PK
        bigint user_id FK
        string title
        string province
        string city
        string postal_code
        string address_line
        string recipient_name
        string recipient_phone
        boolean is_default
        decimal latitude
        decimal longitude
        timestamps timestamps
    }
    categories {
        bigint id PK
        bigint parent_id FK
        string name
        string slug UK
        smallint depth
        boolean is_active
        int sort_order
        timestamps timestamps
    }

    warranties {
        bigint id PK
        string name
        smallint duration_months
        boolean is_active
        timestamps timestamps
    }
    brands {
        bigint id PK
        string name
        string slug UK
        string logo_path
        boolean is_active
        timestamps timestamps
    }
    products {
        bigint id PK
        bigint category_id FK
        bigint brand_id FK
        bigint vendor_id FK
        string name
        string slug UK
        text description
        text ai_generated_description
        string status "draft|pending|approved|rejected"
        string meta_title
        string meta_description
        boolean is_active
        timestamps timestamps
        timestamp deleted_at
    }
    product_images {
        bigint id PK
        bigint product_id FK
        bigint variant_id FK
        string path
        string alt
        int sort_order
        boolean is_primary
        timestamps timestamps
    }
    attributes {
        bigint id PK
        string name UK
        string slug UK
    }
    attribute_values {
        bigint id PK
        bigint attribute_id FK
        string value "UK(attribute_id,value)"
        string color_code
    }
    product_variants {
        bigint id PK
        bigint product_id FK
        string sku UK
        string barcode UK
        int weight_grams
        boolean is_active
        timestamps timestamps
        timestamp deleted_at
    }
    variant_attribute_values {
        bigint variant_id PK,FK
        bigint attribute_id "UK(variant_id,attribute_id)"
        bigint attribute_value_id PK,FK
    }
    vendor_inventories {
        bigint id PK
        bigint vendor_id FK
        bigint variant_id FK
        bigint warranty_id FK
        smallint lead_time_days
        decimal price
        decimal sale_price
        int quantity
        int reserved_quantity
        boolean is_available
        int lock_version
        timestamps timestamps
        timestamp deleted_at
    }
    inventory_reservations {
        bigint id PK
        bigint vendor_inventory_id FK
        bigint cart_id FK
        bigint order_id FK
        int quantity
        string status "active|consumed|released"
        timestamp expires_at
        timestamps timestamps
    }
    inventory_logs {
        bigint id PK
        bigint vendor_inventory_id FK
        bigint order_item_id FK
        int change_quantity
        int quantity_before
        int quantity_after
        string type
        text note
        timestamp created_at
    }
    carts {
        bigint id PK
        bigint user_id FK
        string session_id
        timestamp expires_at
        timestamps timestamps
    }
    cart_items {
        bigint id PK
        bigint cart_id FK
        bigint vendor_inventory_id FK
        int quantity
        decimal unit_price_snapshot
        timestamps timestamps
    }
    coupons {
        bigint id PK
        string code UK
        string discount_type "percent|fixed"
        decimal discount_value
        decimal min_order_amount
        decimal max_discount_amount
        int usage_limit
        int used_count
        bigint vendor_id FK
        timestamp starts_at
        timestamp expires_at
        boolean is_active
        timestamps timestamps
    }
    shipping_methods {
        bigint id PK
        bigint vendor_id FK
        string name
        string code UK
        decimal base_fee
        decimal fee_per_kg
        smallint estimated_days_min
        smallint estimated_days_max
        boolean is_active
        timestamps timestamps
    }
    orders {
        bigint id PK
        bigint user_id FK
        bigint coupon_id FK
        string order_number UK
        json shipping_address_snapshot
        decimal total_items_price
        decimal total_shipping_fee
        decimal discount_total
        decimal tax_total
        decimal grand_total
        string currency
        string payment_status
        string status
        timestamps timestamps
        timestamp deleted_at
    }
    order_histories {
        bigint id PK
        bigint order_id FK
        string from_status
        string to_status
        bigint changed_by_user_id FK
        text note
        timestamp created_at
    }
    sub_orders {
        bigint id PK
        bigint order_id FK
        bigint vendor_id FK
        bigint shipping_method_id FK
        string sub_order_number UK
        decimal subtotal_price
        decimal shipping_fee
        decimal commission_rate
        decimal commission_amount
        decimal vendor_net_amount
        string status
        timestamps timestamps
        timestamp deleted_at
    }
    order_items {
        bigint id PK
        bigint sub_order_id FK
        bigint vendor_inventory_id FK
        string product_name_snapshot
        string variant_sku_snapshot
        json selected_attributes_snapshot
        decimal unit_price
        int quantity
        decimal total_price
        timestamp created_at
    }
    order_status_histories {
        bigint id PK
        bigint sub_order_id FK
        string from_status
        string to_status
        bigint changed_by_user_id FK
        text note
        timestamp created_at
    }
    payments {
        bigint id PK
        bigint order_id FK
        string gateway_name
        string transaction_id UK
        string reference_id
        decimal amount
        string status
        timestamp paid_at
        timestamp created_at
    }
    refunds {
        bigint id PK
        bigint payment_id FK
        bigint sub_order_id FK
        bigint requested_by_user_id FK
        decimal amount
        text reason
        string status
        string gateway_reference
        timestamp processed_at
        timestamps timestamps
    }
    shipments {
        bigint id PK
        bigint sub_order_id FK
        string courier_name
        string tracking_code
        timestamp shipped_at
        timestamp delivered_at
        string status
        timestamps timestamps
    }
    payout_batches {
        bigint id PK
        string reference UK
        decimal total_amount
        string status
        timestamp paid_at
        timestamps timestamps
    }
    vendor_payouts {
        bigint id PK
        bigint vendor_id FK
        bigint sub_order_id FK
        bigint payout_batch_id FK
        decimal amount
        string status
        string payout_reference
        timestamp paid_at
        timestamp created_at
    }
    product_reviews {
        bigint id PK
        bigint product_id FK
        bigint user_id FK
        bigint order_item_id FK,UK
        tinyint rating "1..5"
        text comment
        string ai_sentiment
        decimal ai_sentiment_score
        boolean is_approved
        timestamps timestamps
    }
    ai_jobs {
        bigint id PK
        string job_type
        string target_entity_type "polymorphic, no FK"
        bigint target_entity_id "polymorphic, no FK"
        string status
        json payload
        json result
        smallint attempts
        text error_message
        timestamp started_at
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
    }
```
