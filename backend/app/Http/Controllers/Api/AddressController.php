<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Address\AddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $addresses = Address::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('is_default')
            ->latest('id')
            ->get();

        return AddressResource::collection($addresses);
    }

    public function store(AddressRequest $request): JsonResponse
    {
        $address = DB::transaction(function () use ($request) {
            $attributes = $this->attributes($request);

            if ($attributes['is_default']) {
                $this->clearDefault($request);
            }

            return $request->user()->addresses()->create($attributes);
        });

        return AddressResource::make($address)->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(AddressRequest $request, Address $address): AddressResource
    {
        $this->authorizeAddress($request, $address);

        DB::transaction(function () use ($request, $address) {
            $attributes = $this->attributes($request);

            if ($attributes['is_default']) {
                $this->clearDefault($request, $address->id);
            }

            $address->update($attributes);
        });

        return AddressResource::make($address);
    }

    public function destroy(Request $request, Address $address): Response
    {
        $this->authorizeAddress($request, $address);

        $address->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function attributes(AddressRequest $request): array
    {
        return [
            'title' => $request->input('title'),
            'province' => $request->string('province')->value(),
            'city' => $request->string('city')->value(),
            'postal_code' => $request->input('postal_code'),
            'address_line' => $request->string('address_line')->value(),
            'recipient_name' => $request->string('recipient_name')->value(),
            'recipient_phone' => $request->string('recipient_phone')->value(),
            'is_default' => $request->boolean('is_default'),
            'latitude' => $request->input('latitude'),
            'longitude' => $request->input('longitude'),
        ];
    }

    private function clearDefault(Request $request, ?int $exceptId = null): void
    {
        Address::query()
            ->where('user_id', $request->user()->id)
            ->when($exceptId !== null, fn ($query) => $query->whereKeyNot($exceptId))
            ->update(['is_default' => false]);
    }

    private function authorizeAddress(Request $request, Address $address): void
    {
        abort_unless($address->user_id === $request->user()->id, 404);
    }
}
