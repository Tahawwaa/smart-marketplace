<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\Admin\AdminBrandController;
use App\Http\Controllers\Api\Admin\AdminCategoryController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminOrderController;
use App\Http\Controllers\Api\Admin\AdminProductController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\AdminVendorController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductSearchController;
use App\Http\Controllers\Api\Vendor\VendorAnalyticsController;
use App\Http\Controllers\Api\Vendor\VendorInventoryController;
use App\Http\Controllers\Api\Vendor\VendorOrderController;
use App\Http\Controllers\Api\Vendor\VendorProductController;
use App\Http\Controllers\Api\Vendor\VendorProfileController;
use App\Http\Middleware\EnsureUserIsActive;
use Illuminate\Support\Facades\Route;

Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{category:slug}', [CategoryController::class, 'show']);

Route::get('products', [ProductController::class, 'index']);
Route::get('products/suggest', [ProductSearchController::class, 'suggest'])->middleware('throttle:120,1');
Route::get('products/popular', [ProductSearchController::class, 'popular']);
Route::get('products/{product:slug}/recommendations', [ProductSearchController::class, 'recommendations']);
Route::get('products/{product:slug}', [ProductController::class, 'show']);

Route::get('cart', [CartController::class, 'show']);
Route::post('cart/items', [CartController::class, 'store']);
Route::patch('cart/items/{item}', [CartController::class, 'update']);
Route::delete('cart/items/{item}', [CartController::class, 'destroy']);

Route::middleware(['auth:sanctum', EnsureUserIsActive::class])->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::put('auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('auth/password', [AuthController::class, 'updatePassword']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::get('addresses', [AddressController::class, 'index']);
    Route::post('addresses', [AddressController::class, 'store']);
    Route::put('addresses/{address}', [AddressController::class, 'update']);
    Route::delete('addresses/{address}', [AddressController::class, 'destroy']);

    Route::get('orders', [OrderController::class, 'index']);
    Route::post('orders', [OrderController::class, 'store']);
    Route::get('orders/{order}', [OrderController::class, 'show']);

    Route::post('orders/{order}/pay', [PaymentController::class, 'store']);
    Route::post('payments/{payment}/verify', [PaymentController::class, 'verify']);

    Route::prefix('vendors/me')->group(function () {
        Route::get('/', [VendorProfileController::class, 'show']);
        // «فروشنده شوید»: هر حسابی می‌تواند فروشگاه باز کند؛ فروشگاه تا تأیید مدیر
        // در وضعیت pending می‌ماند.
        Route::post('/', [VendorProfileController::class, 'store']);
        Route::put('/', [VendorProfileController::class, 'update']);

        Route::get('products', [VendorProductController::class, 'index']);
        Route::get('products/{product}', [VendorProductController::class, 'show']);
        Route::post('products', [VendorProductController::class, 'store']);
        Route::put('products/{product}', [VendorProductController::class, 'update']);
        Route::delete('products/{product}', [VendorProductController::class, 'destroy']);

        Route::get('inventory', [VendorInventoryController::class, 'index']);
        Route::put('inventory/{inventory}', [VendorInventoryController::class, 'update']);

        Route::get('orders', [VendorOrderController::class, 'index']);
        Route::get('orders/{subOrder}', [VendorOrderController::class, 'show']);
        Route::patch('orders/{subOrder}/status', [VendorOrderController::class, 'updateStatus']);

        Route::get('analytics', [VendorAnalyticsController::class, 'show']);
        Route::get('orders-export', [VendorAnalyticsController::class, 'exportOrders']);
    });

    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('dashboard', [AdminDashboardController::class, 'show']);

        Route::get('vendors', [AdminVendorController::class, 'index']);
        Route::get('vendors/{vendor}', [AdminVendorController::class, 'show']);
        Route::put('vendors/{vendor}', [AdminVendorController::class, 'update']);
        Route::patch('vendors/{vendor}/status', [AdminVendorController::class, 'updateStatus']);

        Route::get('products', [AdminProductController::class, 'index']);
        Route::get('products/{product}', [AdminProductController::class, 'show']);
        Route::put('products/{product}', [AdminProductController::class, 'update']);
        Route::patch('products/{product}/status', [AdminProductController::class, 'updateStatus']);

        Route::get('orders', [AdminOrderController::class, 'index']);
        Route::get('orders/{order}', [AdminOrderController::class, 'show']);
        Route::patch('orders/{order}/status', [AdminOrderController::class, 'updateStatus']);

        Route::get('users', [AdminUserController::class, 'index']);
        Route::get('users/{user}', [AdminUserController::class, 'show']);
        Route::put('users/{user}', [AdminUserController::class, 'update']);
        Route::delete('users/{user}', [AdminUserController::class, 'destroy']);

        Route::get('categories', [AdminCategoryController::class, 'index']);
        Route::post('categories', [AdminCategoryController::class, 'store']);
        Route::put('categories/{category}', [AdminCategoryController::class, 'update']);
        Route::delete('categories/{category}', [AdminCategoryController::class, 'destroy']);

        Route::get('brands', [AdminBrandController::class, 'index']);
        Route::post('brands', [AdminBrandController::class, 'store']);
        Route::put('brands/{brand}', [AdminBrandController::class, 'update']);
        Route::delete('brands/{brand}', [AdminBrandController::class, 'destroy']);
    });
});
