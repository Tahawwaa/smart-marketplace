<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly CartService $carts) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->string('name')->value(),
            'email' => $request->string('email')->lower()->value(),
            'phone' => $request->filled('phone') ? $request->string('phone')->value() : null,
            'password' => $request->string('password')->value(),
            'role' => $request->input('role') ?? UserRole::Customer->value,
        ]);

        $token = $user->createToken($this->deviceName($request))->plainTextToken;

        $this->carts->mergeGuestCart($user, $this->carts->sessionId($request));

        return response()->json([
            'user' => UserResource::make($user->load('store')),
            'token' => $token,
            'token_type' => 'Bearer',
        ], Response::HTTP_CREATED);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->string('email')->lower()->value())->first();

        if ($user === null || ! Hash::check($request->string('password')->value(), $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'اطلاعات ورود نادرست است.',
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => 'این حساب کاربری غیرفعال است.',
            ]);
        }

        $token = $user->createToken($this->deviceName($request))->plainTextToken;

        $this->carts->mergeGuestCart($user, $this->carts->sessionId($request));

        return response()->json([
            'user' => UserResource::make($user->load('store')),
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function me(Request $request): UserResource
    {
        return UserResource::make($request->user()->load('store'));
    }

    public function updateProfile(UpdateProfileRequest $request): UserResource
    {
        $user = $request->user();
        $user->update($request->validated());

        return UserResource::make($user->load('store'));
    }

    /**
     * Changing the password keeps the current token so the user stays signed in
     * on this device, and drops every other session.
     */
    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $currentToken = $user->currentAccessToken();

        $user->update(['password' => $request->string('password')->value()]);

        $user->tokens()
            ->when($currentToken !== null, fn ($query) => $query->whereKeyNot($currentToken->getKey()))
            ->delete();

        return response()->json(['message' => 'گذرواژه تغییر کرد.']);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if ($token !== null) {
            $token->delete();
        }

        return response()->json(['message' => 'با موفقیت خارج شدید.']);
    }

    private function deviceName(Request $request): string
    {
        return $request->string('device_name')->value() ?: 'api-client';
    }
}
