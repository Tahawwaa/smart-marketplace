<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\AddCartItemRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\VendorInventory;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CartController extends Controller
{
    public function __construct(private readonly CartService $carts) {}

    public function show(Request $request): JsonResponse
    {
        $cart = $this->carts->resolve($request) ?? new Cart;

        return $this->cartResponse($cart);
    }

    public function store(AddCartItemRequest $request): JsonResponse
    {
        $cart = $this->carts->requireCart($request);
        $inventory = VendorInventory::query()->findOrFail($request->integer('vendor_inventory_id'));

        $this->carts->addItem($cart, $inventory, $request->quantity());

        return $this->cartResponse($cart);
    }

    public function update(UpdateCartItemRequest $request, int $item): JsonResponse
    {
        $cartItem = $this->ownedItem($request, $item);

        $this->carts->updateQuantity($cartItem, $request->quantity());

        return $this->cartResponse($cartItem->cart);
    }

    public function destroy(Request $request, int $item): JsonResponse
    {
        $cartItem = $this->ownedItem($request, $item);
        $cart = $cartItem->cart;

        $cartItem->delete();

        return $this->cartResponse($cart);
    }

    /**
     * Reading a cart always answers 200, even when the cart was just created
     * or a line was just added.
     */
    private function cartResponse(Cart $cart): JsonResponse
    {
        return CartResource::make($this->withItems($cart))
            ->response()
            ->setStatusCode(Response::HTTP_OK);
    }

    /**
     * Find a line that belongs to the caller cart; someone else's id gives 404.
     */
    private function ownedItem(Request $request, int $id): CartItem
    {
        $cart = $this->carts->resolve($request, create: false);

        abort_if($cart === null, 404);

        return CartItem::query()
            ->where('cart_id', $cart->id)
            ->with(['inventory.variant.product', 'inventory.vendor'])
            ->findOrFail($id);
    }

    private function withItems(Cart $cart): Cart
    {
        return $cart->load(['items.inventory.variant.product', 'items.inventory.vendor']);
    }
}
