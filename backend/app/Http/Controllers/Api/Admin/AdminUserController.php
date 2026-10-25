<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\Admin\AdminUserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class AdminUserController extends AdminController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $users = User::query()
            ->when(
                $request->filled('role'),
                fn ($query) => $query->where('role', $request->string('role')->value()),
            )
            ->when(
                $request->has('is_active'),
                fn ($query) => $query->where('is_active', $request->boolean('is_active')),
            )
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(
                    fn ($inner) => $inner
                        ->where('name', 'like', '%'.$request->string('search')->value().'%')
                        ->orWhere('email', 'like', '%'.$request->string('search')->value().'%')
                        ->orWhere('phone', 'like', '%'.$request->string('search')->value().'%'),
                ),
            )
            ->with('vendors:id,user_id,store_name,slug,status')
            ->withCount('orders')
            ->latest('id')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return AdminUserResource::collection($users);
    }

    public function show(User $user): AdminUserResource
    {
        return AdminUserResource::make(
            $user->load('vendors:id,user_id,store_name,slug,status')->loadCount('orders'),
        );
    }

    /**
     * Admins manage account state and roles here, never passwords.
     */
    public function update(UpdateUserRequest $request, User $user): AdminUserResource
    {
        DB::transaction(function () use ($request, $user) {
            $admins = User::query()->where('role', UserRole::Admin)->where('is_active', true)->lockForUpdate()->get();
            $user->refresh();
            $payload = $request->validated();
            $removesAdmin = ($payload['role'] ?? $user->role->value) !== UserRole::Admin->value
                || ! ($payload['is_active'] ?? $user->is_active);

            abort_if($user->isAdmin() && $user->is_active && $removesAdmin && $admins->count() <= 1,
                422, 'آخرین مدیر فعال سامانه را نمی‌توان غیرفعال کرد یا نقش او را تغییر داد.');

            $user->update($payload);
        });

        return AdminUserResource::make(
            $user->load('vendors:id,user_id,store_name,slug,status')->loadCount('orders'),
        );
    }

    /**
     * Guard against the marketplace locking itself out.
     */
    public function destroy(Request $request, User $user): Response
    {
        abort_if($user->id === $request->user()->id, 422, 'نمی‌توانید حساب خودتان را حذف کنید.');

        $remainingAdmins = User::query()
            ->where('role', UserRole::Admin)
            ->where('is_active', true)
            ->whereKeyNot($user->id)
            ->count();

        abort_if($user->isAdmin() && $remainingAdmins === 0, 422, 'آخرین مدیر سامانه را نمی‌توان حذف کرد.');

        abort_if($user->orders()->withTrashed()->exists() || $user->vendors()->withTrashed()->exists(),
            422, 'این حساب سفارش یا فروشگاه دارد؛ به جای حذف، آن را غیرفعال کنید.');

        DB::transaction(function () use ($user) {
            $user->tokens()->delete();
            $user->delete();
        });

        return response()->noContent();
    }
}
