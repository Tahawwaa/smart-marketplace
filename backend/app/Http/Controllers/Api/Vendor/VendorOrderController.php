<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Enums\OrderStatus;
use App\Http\Requests\Vendor\UpdateSubOrderStatusRequest;
use App\Http\Resources\VendorSubOrderResource;
use App\Models\OrderStatusHistory;
use App\Models\SubOrder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

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
    public function updateStatus(UpdateSubOrderStatusRequest $request, SubOrder $subOrder): VendorSubOrderResource
    {
        $vendor = $this->vendor($request);

        abort_unless($subOrder->vendor_id === $vendor->id, 404);

        $status = OrderStatus::from($request->string('status')->value());

        DB::transaction(function () use ($request, $subOrder, $status) {
            $from = $subOrder->status;

            $subOrder->update(['status' => $status]);

            OrderStatusHistory::create([
                'sub_order_id' => $subOrder->id,
                'from_status' => $from?->value,
                'to_status' => $status->value,
                'changed_by_user_id' => $request->user()->id,
                'note' => $request->input('note'),
            ]);
        });

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
