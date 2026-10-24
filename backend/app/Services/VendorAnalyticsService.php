<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\OrderItem;
use App\Models\SubOrder;
use App\Models\Vendor;
use App\Models\VendorInventory;
use App\Models\VendorPayout;
use Illuminate\Support\Carbon;

class VendorAnalyticsService
{
    private const SOLD_STATUSES = [
        OrderStatus::Confirmed,
        OrderStatus::Processing,
        OrderStatus::Shipped,
        OrderStatus::Delivered,
    ];

    private const LOW_STOCK_THRESHOLD = 5;

    /**
     * @return array<string, mixed>
     */
    public function summary(Vendor $vendor, int $days = 30): array
    {
        $since = Carbon::today()->subDays($days - 1);

        $sold = SubOrder::query()
            ->where('vendor_id', $vendor->id)
            ->whereHas('order', fn ($order) => $order->whereIn('payment_status', [PaymentStatus::Paid, PaymentStatus::PartiallyRefunded]))
            ->whereIn('status', array_map(fn (OrderStatus $status) => $status->value, self::SOLD_STATUSES))
            ->where('created_at', '>=', $since)
            ->get(['id', 'subtotal_price', 'commission_amount', 'vendor_net_amount', 'created_at']);

        $byDay = $sold->groupBy(fn (SubOrder $row) => $row->created_at->toDateString());

        $daily = collect(range(0, $days - 1))->map(function (int $offset) use ($since, $byDay) {
            $date = $since->copy()->addDays($offset)->toDateString();
            $rows = $byDay->get($date, collect());

            return [
                'date' => $date,
                'orders' => $rows->count(),
                'revenue' => (float) $rows->sum('subtotal_price'),
            ];
        })->values()->all();

        $statusCounts = SubOrder::query()
            ->where('vendor_id', $vendor->id)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->map(fn ($total) => (int) $total)
            ->all();

        $topProducts = OrderItem::query()
            ->join('sub_orders', 'sub_orders.id', '=', 'order_items.sub_order_id')
            ->where('sub_orders.vendor_id', $vendor->id)
            ->whereHas('subOrder.order', fn ($order) => $order->whereIn('payment_status', [PaymentStatus::Paid, PaymentStatus::PartiallyRefunded]))
            ->where('sub_orders.created_at', '>=', $since)
            ->whereNull('sub_orders.deleted_at')
            ->whereIn('sub_orders.status', array_map(fn (OrderStatus $status) => $status->value, self::SOLD_STATUSES))
            ->selectRaw('order_items.product_name_snapshot as name, sum(order_items.quantity) as units, sum(order_items.total_price) as revenue')
            ->groupBy('order_items.product_name_snapshot')
            ->orderByDesc('units')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'units' => (int) $row->units,
                'revenue' => (float) $row->revenue,
            ])->all();

        $lowStock = VendorInventory::query()
            ->where('vendor_id', $vendor->id)
            ->whereRaw('(quantity - reserved_quantity) <= ?', [self::LOW_STOCK_THRESHOLD])
            ->with('variant.product:id,name')
            ->orderByRaw('(quantity - reserved_quantity) asc')
            ->limit(8)
            ->get()
            ->map(fn (VendorInventory $row) => [
                'id' => $row->id,
                'name' => $row->variant?->product?->name,
                'sku' => $row->variant?->sku,
                'available_quantity' => $row->availableQuantity(),
            ])->all();

        $payouts = VendorPayout::query()->where('vendor_id', $vendor->id);

        return [
            'period_days' => $days,
            'catalog' => [
                'products' => $vendor->products()->count(),
                'pending_products' => $vendor->products()->where('status', 'pending')->count(),
                'out_of_stock' => $vendor->inventories()->whereColumn('quantity', '<=', 'reserved_quantity')->count(),
            ],
            'totals' => [
                'orders' => $sold->count(),
                'revenue' => (float) $sold->sum('subtotal_price'),
                'commission' => (float) $sold->sum('commission_amount'),
                'net' => (float) $sold->sum('vendor_net_amount'),
                'average_order_value' => $sold->isEmpty() ? 0.0 : round((float) $sold->avg('subtotal_price'), 2),
            ],
            'payouts' => [
                'pending' => (float) (clone $payouts)->where('status', 'pending')->sum('amount'),
                'paid' => (float) (clone $payouts)->where('status', 'paid')->sum('amount'),
            ],
            'daily' => $daily,
            'status_counts' => $statusCounts,
            'top_products' => $topProducts,
            'low_stock' => $lowStock,
        ];
    }
}
