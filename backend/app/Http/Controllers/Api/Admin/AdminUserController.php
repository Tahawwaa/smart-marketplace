<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\Admin\AdminUserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

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
        $user->update($request->validated());

        return AdminUserResource::make(
            $user->load('vendors:id,user_id,store_name,slug,status')->loadCount('orders'),
        );
    }

    /**
     * Guard against the marketplace locking itself out.
     */
    public function destroy(Request $request, User $user): \Illuminate\Http\Response
    {
        abort_if($user->id === $request->user()->id, 422, 'نمی‌توانید حساب خودتان را حذف کنید.');

        $remainingAdmins = User::query()
            ->where('role', UserRole::Admin)
            ->whereKeyNot($user->id)
            ->count();

        abort_if($user->isAdmin() && $remainingAdmins === 0, 422, 'آخرین مدیر سامانه را نمی‌توان حذف کرد.');

        $user->delete();

        return response()->noContent();
    }
}
