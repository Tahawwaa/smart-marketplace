<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\OrderStatus;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Http\Resources\Admin\AdminOrderResource;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\SubOrder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

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
            ->withCount('subOrders')
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
        ])->loadCount('subOrders'));
    }

    /**
     * Admins own the terminal transitions: cancelling and refunding.
     *
     * The change lands on the parent order and every sub-order beneath it, and
     * each flip is recorded on the sub-order history so the vendor timeline
     * stays truthful.
     */
    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): AdminOrderResource
    {
        $status = OrderStatus::from($request->string('status')->value());
        $note = $request->input('note');

        DB::transaction(function () use ($order, $status, $note, $request) {
            $order->update(['status' => $status]);

            $order->subOrders()->get()->each(function (SubOrder $subOrder) use ($status, $note, $request) {
                $from = $subOrder->status;

                $subOrder->update(['status' => $status]);

                OrderStatusHistory::create([
                    'sub_order_id' => $subOrder->id,
                    'from_status' => $from?->value,
                    'to_status' => $status->value,
                    'changed_by_user_id' => $request->user()->id,
                    'note' => $note,
                ]);
            });
        });

        return AdminOrderResource::make($order->fresh()->load([
            'user:id,name,email,phone',
            'subOrders.items',
            'subOrders.vendor:id,store_name,slug',
        ])->loadCount('subOrders'));
    }
}
