<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $categories = Category::query()
            ->when(
                $request->filled('parent_id'),
                fn ($query) => $query->where('parent_id', $request->integer('parent_id')),
                fn ($query) => $query->whereNull('parent_id'),
            )
            ->where('is_active', true)
            ->with('childrenRecursive')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function show(Category $category): CategoryResource
    {
        abort_unless($category->is_active, 404);

        $category->load(['parent:id,name,slug', 'childrenRecursive']);

        return CategoryResource::make($category);
    }
}
