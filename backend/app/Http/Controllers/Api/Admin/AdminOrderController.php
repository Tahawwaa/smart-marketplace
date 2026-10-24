<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\OrderStatus;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Http\Resources\Admin\AdminOrderResource;
use App\Models\Order;
use App\Services\OrderStatusService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminOrderController extends AdminController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = Order::query()
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')->value()),
            )
            ->when(
                $request->filled('payment_status'),
                fn ($query) => $query->where('payment_status', $request->string('payment_status')->value()),
            )
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where('order_number', 'like', '%'.$request->string('search')->value().'%'),
            )
            ->with('user:id,name,email,phone')
            ->withCount('items')
            ->latest('id')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return AdminOrderResource::collection($orders);
    }

    public function show(Order $order): AdminOrderResource
    {
        return AdminOrderResource::make($order->load([
            'user:id,name,email,phone',
            'subOrders.items',
            'subOrders.vendor:id,store_name,slug',
        ])->loadCount('items'));
    }

    /**
     * Admins own the terminal transitions: cancelling and refunding.
     *
     * The change lands on the parent order and every sub-order beneath it, and
     * each flip is recorded on the sub-order history so the vendor timeline
     * stays truthful.
     */
    public function updateStatus(UpdateOrderStatusRequest $request, Order $order, OrderStatusService $statuses): AdminOrderResource
    {
        $status = OrderStatus::from($request->string('status')->value());
        $note = $request->input('note');

        $statuses->updateAdmin($order, $status, $request->user(), $note);

        return AdminOrderResource::make($order->fresh()->load([
            'user:id,name,email,phone',
            'subOrders.items',
            'subOrders.vendor:id,store_name,slug',
        ])->loadCount('items'));
    }
}
