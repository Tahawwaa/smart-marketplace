<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Resources\AddressResource;
use App\Http\Resources\OrderResource;
use App\Models\Address;
use App\Models\Order;
use App\Services\CartService;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = Order::query()
            ->where('user_id', $request->user()->id)
            ->with(['subOrders.items'])
            ->withCount('subOrders')
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return OrderResource::collection($orders);
    }

    public function show(Request $request, Order $order): OrderResource
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        return OrderResource::make($order->load($this->relations()));
    }

    /**
     * Relations an order needs to render its detail view.
     *
     * @return array<int, string>
     */
    private function relations(): array
    {
        return ['subOrders.items', 'subOrders.vendor:id,store_name,slug'];
    }

    public function store(
        StoreOrderRequest $request,
        OrderService $orders,
        CartService $carts,
    ): JsonResponse {
        $cart = $carts->resolve($request, create: false);

        if ($cart === null) {
            throw ValidationException::withMessages(['cart' => 'سبد خرید خالی است.']);
        }

        $cart->load(['items.inventory.variant.product', 'items.inventory.vendor']);

        $order = $orders->placeFromCart(
            $request->user(),
            $cart,
            $this->addressSnapshot($request),
        );

        return OrderResource::make($order)->response()->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Freeze the chosen address onto the order.
     *
     * @return array<string, mixed>
     */
    private function addressSnapshot(StoreOrderRequest $request): array
    {
        $addressId = $request->input('address_id');

        if ($addressId !== null) {
            $address = Address::query()
                ->where('user_id', $request->user()->id)
                ->find($addressId);

            if ($address === null) {
                throw ValidationException::withMessages([
                    'address_id' => 'نشانی انتخاب‌شده یافت نشد.',
                ]);
            }

            return (array) AddressResource::make($address)->resolve($request) + ['address_id' => $address->id];
        }

        return (array) $request->input('address', []);
    }
}
