<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Enums\OrderStatus;
use App\Http\Requests\Vendor\UpdateSubOrderStatusRequest;
use App\Http\Resources\VendorSubOrderResource;
use App\Models\SubOrder;
use App\Services\OrderStatusService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VendorOrderController extends VendorController
{
    /**
     * The sub-orders this store has to fulfil.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $vendor = $this->vendor($request);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:pending,confirmed,processing,shipped,delivered,cancelled,refunded'],
            'payment_status' => ['nullable', 'in:pending,paid,failed,refunded,partially_refunded'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $subOrders = SubOrder::query()
            ->where('vendor_id', $vendor->id)
            ->whereHas('order')
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query
                ->where('sub_order_number', 'like', '%'.$search.'%')
                ->orWhereHas('order', fn ($order) => $order->where('order_number', 'like', '%'.$search.'%')
                    ->orWhereHas('user', fn ($user) => $user->where('name', 'like', '%'.$search.'%')))))
            ->when($filters['payment_status'] ?? null, fn ($query, $status) => $query->whereHas('order', fn ($order) => $order->where('payment_status', $status)))
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')->value()),
            )
            ->with([
                'items',
                'order:id,user_id,order_number,status,payment_status,shipping_address_snapshot,created_at',
                'order.user:id,name,email,phone',
            ])
            ->latest('id')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();

        return VendorSubOrderResource::collection($subOrders);
    }

    public function show(Request $request, SubOrder $subOrder): VendorSubOrderResource
    {
        abort_unless($subOrder->vendor_id === $this->vendor($request)->id, 404);

        return VendorSubOrderResource::make($subOrder->load($this->relations()));
    }

    /**
     * Move a sub-order along and keep an audit trail of the change.
     */
    public function updateStatus(UpdateSubOrderStatusRequest $request, SubOrder $subOrder, OrderStatusService $statuses): VendorSubOrderResource
    {
        $vendor = $this->vendor($request);

        abort_unless($subOrder->vendor_id === $vendor->id, 404);

        $status = OrderStatus::from($request->string('status')->value());

        $statuses->updateVendor($subOrder, $status, $request->user(), $request->input('note'));
        $subOrder->refresh();

        return VendorSubOrderResource::make($subOrder->load($this->relations()));
    }

    /**
     * @return array<int, string>
     */
    private function relations(): array
    {
        return [
            'items',
            'statusHistories' => fn ($query) => $query->orderByDesc('id'),
            'order:id,user_id,order_number,status,payment_status,shipping_address_snapshot,created_at',
            'order.user:id,name,email,phone',
        ];
    }
}
