<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Http\Resources\Admin\AdminCategoryResource;
use App\Models\Category;
use App\Support\Slug;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class AdminCategoryController extends AdminController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $categories = Category::query()
            ->when(
                $request->filled('parent_id'),
                fn ($query) => $query->where('parent_id', $request->integer('parent_id')),
            )
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where('name', 'like', '%'.$request->string('search')->value().'%'),
            )
            ->withCount('products')
            ->orderBy('depth')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return AdminCategoryResource::collection($categories);
    }

    public function store(StoreCategoryRequest $request): AdminCategoryResource
    {
        $category = Category::create($this->attributes($request));

        return AdminCategoryResource::make($category->loadCount('products'));
    }

    public function update(UpdateCategoryRequest $request, Category $category): AdminCategoryResource
    {
        $category->update($this->attributes($request, $category));

        return AdminCategoryResource::make($category->loadCount('products'));
    }

    /**
     * A category holding products stays put; empty ones can go.
     */
    public function destroy(Category $category): Response
    {
        abort_if(
            $category->products()->exists() || $category->children()->exists(),
            422,
            'این دسته‌بندی کالا یا زیردسته دارد و حذف نمی‌شود.',
        );

        $category->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function attributes(StoreCategoryRequest|UpdateCategoryRequest $request, ?Category $category = null): array
    {
        $payload = $request->validated();
        $name = $payload['name'] ?? $category?->name;

        // A slug is only derived when the caller leaves it out, so an admin can
        // pin a stable URL before renaming a category.
        $payload['slug'] = $payload['slug'] ?? $this->uniqueSlug($name, $category);

        return $payload;
    }

    private function uniqueSlug(string $name, ?Category $category): string
    {
        $base = Slug::make($name, 'category');
        $slug = $base;
        $counter = 1;

        while (Category::query()
            ->where('slug', $slug)
            ->when($category !== null, fn ($query) => $query->whereKeyNot($category->id))
            ->exists()
        ) {
            $slug = $base.'-'.(++$counter);
        }

        return $slug;
    }
}
