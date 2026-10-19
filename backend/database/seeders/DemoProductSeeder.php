<?php

namespace Database\Seeders;

use App\Enums\ProductStatus;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Vendor;
use App\Models\VendorInventory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoProductSeeder extends Seeder
{
    /**
     * @var array<string, string>
     */
    private const CATEGORIES = [
        'mobile' => 'موبایل و لوازم جانبی',
        'laptop' => 'لپ‌تاپ و تبلت',
        'home' => 'خانه و آشپزخانه',
        'fashion' => 'مد و پوشاک',
        'beauty' => 'زیبایی و سلامت',
        'sport' => 'ورزش و سفر',
    ];

    /**
     * @var list<array{0: string, 1: string, 2: string, 3: string, 4: int, 5: ?int}>
     */
    private const PRODUCTS = [
        ['iphone', 'mobile', 'سام‌تک', 'گوشی هوشمند پرچم‌دار ۲۵۶ گیگابایت', 42900000, 46500000],
        ['headphones-max', 'mobile', 'آوا', 'هدفون بی‌سیم نویزکنسلینگ اورایر', 6800000, 7600000],
        ['laptop-pro', 'laptop', 'زِنیت', 'لپ‌تاپ ۱۴ اینچ نمایشگر لیکوئید', 89900000, 96000000],
        ['tablet-pen', 'laptop', 'سام‌تک', 'تبلت قلم‌دار ۱۲ اینچ', 24800000, 27000000],
        ['blender', 'home', 'کلینکس', 'مخلوط‌کن حرفه‌ای با پارچ شیشه‌ای', 4200000, null],
        ['office-chair', 'home', 'آرمان‌چوب', 'صندلی مدیریتی ارگونومیک', 12400000, null],
        ['sneakers', 'fashion', 'رانوا', 'کفش کتانی راحتی سفید', 2800000, null],
        ['leather-watch', 'fashion', 'تایمکس', 'ساعت مچی کرنوگراف بند چرم', 8700000, 9900000],
        ['perfume', 'beauty', 'نُت', 'ادکلن زنانه گل و میوه ۱۰۰ میلی‌لیتر', 4100000, 4600000],
        ['lipstick', 'beauty', 'دِرمی', 'رژ لب مات ماندگار', 690000, null],
        ['basketball', 'sport', 'فیت‌لاین', 'توپ بسکتبال سایز ۷ مسابقه‌ای', 2300000, 2700000],
        ['tennis-racket', 'sport', 'فیت‌لاین', 'راکت تنیس حرفه‌ای', 5200000, null],
    ];

    public function run(): void
    {
        $vendor = Vendor::query()->firstOrFail();

        $this->purgeProducts();

        $categories = [];
        foreach (self::CATEGORIES as $slug => $name) {
            $categories[$slug] = Category::query()->firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'is_active' => true],
            );
        }

        foreach (self::PRODUCTS as $index => [$image, $categorySlug, $brandName, $name, $price, $oldPrice]) {
            $brand = Brand::query()->firstOrCreate(
                ['slug' => 'brand-'.md5($brandName)],
                ['name' => $brandName, 'is_active' => true],
            );

            $product = Product::query()->create([
                'category_id' => $categories[$categorySlug]->id,
                'brand_id' => $brand->id,
                'vendor_id' => $vendor->id,
                'name' => $name,
                'slug' => $image,
                'description' => $name.' — محصول دمو برای نمایش فروشگاه.',
                'status' => ProductStatus::Approved,
                'is_active' => true,
            ]);

            ProductImage::query()->create([
                'product_id' => $product->id,
                'path' => "/products/{$image}.webp",
                'alt' => $name,
                'sort_order' => 0,
                'is_primary' => true,
            ]);

            $variant = ProductVariant::query()->create([
                'product_id' => $product->id,
                'sku' => 'DEMO-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                'weight_grams' => 500,
                'is_active' => true,
            ]);

            VendorInventory::query()->create([
                'vendor_id' => $vendor->id,
                'variant_id' => $variant->id,
                'price' => $oldPrice ?? $price,
                'sale_price' => $oldPrice === null ? null : $price,
                'quantity' => 25,
                'reserved_quantity' => 0,
                'is_available' => true,
            ]);
        }
    }

    private function purgeProducts(): void
    {
        DB::table('cart_items')->delete();
        DB::table('inventory_reservations')->delete();
        DB::table('inventory_logs')->delete();
        DB::table('vendor_inventories')->delete();
        DB::table('product_images')->delete();
        DB::table('product_variants')->delete();
        DB::table('products')->delete();
    }
}
