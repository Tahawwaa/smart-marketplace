<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\Vendor\VendorInventoryController;
use App\Http\Controllers\Api\Vendor\VendorOrderController;
use App\Http\Controllers\Api\Vendor\VendorProductController;
use App\Http\Controllers\Api\Vendor\VendorProfileController;
use Illuminate\Support\Facades\Route;

Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{category:slug}', [CategoryController::class, 'show']);

Route::get('products', [ProductController::class, 'index']);
Route::get('products/{product:slug}', [ProductController::class, 'show']);

Route::get('cart', [CartController::class, 'show']);
Route::post('cart/items', [CartController::class, 'store']);
Route::patch('cart/items/{item}', [CartController::class, 'update']);
Route::delete('cart/items/{item}', [CartController::class, 'destroy']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
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

        Route::get('products', [VendorProductController::class, 'index']);
        Route::post('products', [VendorProductController::class, 'store']);
        Route::put('products/{product}', [VendorProductController::class, 'update']);
        Route::delete('products/{product}', [VendorProductController::class, 'destroy']);

        Route::get('inventory', [VendorInventoryController::class, 'index']);
        Route::put('inventory/{inventory}', [VendorInventoryController::class, 'update']);

        Route::get('orders', [VendorOrderController::class, 'index']);
        Route::patch('orders/{subOrder}/status', [VendorOrderController::class, 'updateStatus']);
    });
});
