<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Enums\OrderStatus;
use App\Http\Requests\Vendor\UpdateSubOrderStatusRequest;
use App\Http\Resources\VendorSubOrderResource;
use App\Services\OrderStatusService;
use App\Models\SubOrder;
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

        $subOrders = SubOrder::query()
            ->where('vendor_id', $vendor->id)
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
            ->paginate(15)
            ->withQueryString();

        return VendorSubOrderResource::collection($subOrders);
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
            'order:id,user_id,order_number,status,payment_status,shipping_address_snapshot,created_at',
            'order.user:id,name,email,phone',
        ];
    }
}
