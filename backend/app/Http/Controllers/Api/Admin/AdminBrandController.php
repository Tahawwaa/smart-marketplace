<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Requests\Admin\StoreBrandRequest;
use App\Http\Requests\Admin\UpdateBrandRequest;
use App\Http\Resources\Admin\AdminBrandResource;
use App\Models\Brand;
use App\Support\Slug;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class AdminBrandController extends AdminController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $brands = Brand::query()
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where('name', 'like', '%'.$request->string('search')->value().'%'),
            )
            ->withCount('products')
            ->orderBy('name')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return AdminBrandResource::collection($brands);
    }

    public function store(StoreBrandRequest $request): AdminBrandResource
    {
        $brand = Brand::create($this->attributes($request));

        return AdminBrandResource::make($brand->loadCount('products'));
    }

    public function update(UpdateBrandRequest $request, Brand $brand): AdminBrandResource
    {
        $brand->update($this->attributes($request, $brand));

        return AdminBrandResource::make($brand->loadCount('products'));
    }

    public function destroy(Brand $brand): Response
    {
        abort_if($brand->products()->exists(), 422, 'این برند کالا دارد و حذف نمی‌شود.');

        $brand->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function attributes(StoreBrandRequest|UpdateBrandRequest $request, ?Brand $brand = null): array
    {
        $payload = $request->validated();
        $name = $payload['name'] ?? $brand?->name;

        $payload['slug'] = $payload['slug'] ?? $brand?->slug ?? $this->uniqueSlug($name, $brand);

        return $payload;
    }

    private function uniqueSlug(string $name, ?Brand $brand): string
    {
        $base = Slug::make($name, 'brand');
        $slug = $base;
        $counter = 1;

        while (Brand::query()
            ->where('slug', $slug)
            ->when($brand !== null, fn ($query) => $query->whereKeyNot($brand->id))
            ->exists()
        ) {
            $slug = $base.'-'.(++$counter);
        }

        return $slug;
    }
}
