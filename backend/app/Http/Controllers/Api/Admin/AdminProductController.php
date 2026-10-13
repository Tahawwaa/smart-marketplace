<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ProductStatus;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Http\Requests\Admin\UpdateProductStatusRequest;
use App\Http\Resources\Admin\AdminProductResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminProductController extends AdminController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $products = Product::query()
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')->value()),
            )
            ->when(
                $request->filled('vendor'),
                fn ($query) => $query->where('vendor_id', $request->integer('vendor')),
            )
            ->when(
                $request->filled('category'),
                fn ($query) => $query->where('category_id', $request->integer('category')),
            )
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where('name', 'like', '%'.$request->string('search')->value().'%'),
            )
            ->with(['category:id,name,slug', 'brand:id,name,slug', 'vendor:id,store_name,slug'])
            ->latest('id')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return AdminProductResource::collection($products);
    }

    public function show(Product $product): AdminProductResource
    {
        return AdminProductResource::make($product->load([
            'category:id,name,slug',
            'brand:id,name,slug',
            'vendor:id,store_name,slug',
            'variants.inventories',
        ]));
    }

    /**
     * Publish or reject a vendor submission.
     *
     * Rejecting also hides the product so it can never surface in the catalog,
     * while approving makes it live.
     */
    public function updateStatus(UpdateProductStatusRequest $request, Product $product): AdminProductResource
    {
        $status = ProductStatus::from($request->string('status')->value());

        $product->update([
            'status' => $status,
            'is_active' => $status === ProductStatus::Approved,
        ]);

        return AdminProductResource::make($product->load([
            'category:id,name,slug',
            'brand:id,name,slug',
            'vendor:id,store_name,slug',
        ]));
    }

    public function update(UpdateProductRequest $request, Product $product): AdminProductResource
    {
        $product->update($request->validated());

        return AdminProductResource::make($product->load([
            'category:id,name,slug',
            'brand:id,name,slug',
            'vendor:id,store_name,slug',
        ]));
    }
}
