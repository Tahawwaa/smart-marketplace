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

        $until = Carbon::tomorrow();
        $soldQuery = SubOrder::query()
            ->where('vendor_id', $vendor->id)
            ->whereHas('order', fn ($order) => $order->whereIn('payment_status', [PaymentStatus::Paid, PaymentStatus::PartiallyRefunded]))
            ->whereIn('status', array_map(fn (OrderStatus $status) => $status->value, self::SOLD_STATUSES))
            ;

        $sold = (clone $soldQuery)->where('created_at', '>=', $since)->where('created_at', '<', $until);
        $totals = $this->totals(clone $sold);
        $previous = $this->totals((clone $soldQuery)->where('created_at', '>=', $since->copy()->subDays($days))->where('created_at', '<', $since));
        $byDay = (clone $sold)->selectRaw('DATE(created_at) as day, count(*) as orders, sum(subtotal_price) as revenue')
            ->groupByRaw('DATE(created_at)')->get()->keyBy('day');

        $daily = collect(range(0, $days - 1))->map(function (int $offset) use ($since, $byDay) {
            $date = $since->copy()->addDays($offset)->toDateString();
            $row = $byDay->get($date);

            return [
                'date' => $date,
                'orders' => (int) ($row?->orders ?? 0),
                'revenue' => (float) ($row?->revenue ?? 0),
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
            ->where('sub_orders.created_at', '<', $until)
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
            ->whereHas('variant.product')
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
            'period' => ['from' => $since->toDateString(), 'to' => Carbon::today()->toDateString()],
            'previous_totals' => $previous,
            'revenue_change_percent' => $previous['revenue'] > 0 ? round(($totals['revenue'] - $previous['revenue']) / $previous['revenue'] * 100, 1) : null,
            'fulfillment' => [
                'to_prepare' => (clone $soldQuery)->whereIn('status', ['confirmed', 'processing'])->count(),
                'in_transit' => (clone $soldQuery)->where('status', 'shipped')->count(),
            ],
            'catalog' => [
                'products' => $vendor->products()->count(),
                'pending_products' => $vendor->products()->where('status', 'pending')->count(),
                'out_of_stock' => $vendor->inventories()->whereHas('variant.product')->whereColumn('quantity', '<=', 'reserved_quantity')->count(),
            ],
            'totals' => $totals,
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

    /** @return array<string, int|float> */
    private function totals(\Illuminate\Database\Eloquent\Builder $query): array
    {
        $row = $query->selectRaw('count(*) as orders, coalesce(sum(subtotal_price), 0) as revenue, coalesce(sum(commission_amount), 0) as commission, coalesce(sum(vendor_net_amount), 0) as net')->first();

        return [
            'orders' => (int) $row->orders,
            'revenue' => (float) $row->revenue,
            'commission' => (float) $row->commission,
            'net' => (float) $row->net,
            'average_order_value' => $row->orders > 0 ? round((float) $row->revenue / $row->orders, 2) : 0.0,
        ];
    }

}
