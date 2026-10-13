<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductStatus;
use App\Enums\UserRole;
use App\Enums\VendorStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\SubOrder;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorInventory;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

class AdminDashboardService
{
    private const REVENUE_PAYMENT_STATUSES = [PaymentStatus::Paid, PaymentStatus::PartiallyRefunded];

    /**
     * Build the whole overview in one pass so the panel needs a single request.
     *
     * @return array<string, mixed>
     */
    public function overview(int $trendDays = 14): array
    {
        return [
            'cards' => $this->cards(),
            'revenue_trend' => $this->revenueTrend($trendDays),
            'order_status_breakdown' => $this->orderStatusBreakdown(),
            'top_vendors' => $this->topVendors(),
            'recent_orders' => $this->recentOrders(),
            'pending_queues' => $this->pendingQueues(),
        ];
    }

    /**
     * Headline numbers for the dashboard cards.
     *
     * @return array<string, mixed>
     */
    private function cards(): array
    {
        $revenueQuery = $this->revenueQuery();
        $today = CarbonImmutable::today();

        return [
            'revenue_total' => (float) $revenueQuery->clone()->sum('grand_total'),
            'revenue_today' => (float) $revenueQuery->clone()->where('created_at', '>=', $today)->sum('grand_total'),
            'revenue_30_days' => (float) $revenueQuery->clone()->where('created_at', '>=', $today->subDays(29))->sum('grand_total'),
            'orders_total' => Order::query()->count(),
            'orders_today' => Order::query()->where('created_at', '>=', $today)->count(),
            'customers_total' => User::query()->where('role', UserRole::Customer)->count(),
            'vendors_total' => Vendor::query()->count(),
            'vendors_pending' => Vendor::query()->where('status', VendorStatus::Pending)->count(),
            'products_total' => Product::query()->count(),
            'products_pending' => Product::query()->where('status', ProductStatus::Pending)->count(),
            'low_stock_variants' => $this->lowStockVariants(),
        ];
    }

    /**
     * Daily paid revenue for the trailing window, including empty days.
     *
     * @return array<int, array{date: string, revenue: float, orders: int}>
     */
    private function revenueTrend(int $days): array
    {
        $start = CarbonImmutable::today()->subDays(max($days, 1) - 1);

        $rows = $this->revenueQuery()
            ->where('created_at', '>=', $start)
            ->get(['created_at', 'grand_total'])
            ->groupBy(fn (Order $order) => $order->created_at->toDateString())
            ->map(fn ($group) => [
                'revenue' => (float) $group->sum(fn (Order $order) => (float) $order->grand_total),
                'orders' => $group->count(),
            ]);

        $trend = [];

        for ($offset = 0; $offset < max($days, 1); $offset++) {
            $date = $start->addDays($offset)->toDateString();
            $bucket = $rows->get($date);

            $trend[] = [
                'date' => $date,
                'revenue' => $bucket['revenue'] ?? 0.0,
                'orders' => $bucket['orders'] ?? 0,
            ];
        }

        return $trend;
    }

    /**
     * How many orders sit in each lifecycle status.
     *
     * @return array<int, array{status: string, count: int}>
     */
    private function orderStatusBreakdown(): array
    {
        $counts = Order::query()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        return collect(OrderStatus::cases())
            ->map(fn (OrderStatus $status) => [
                'status' => $status->value,
                'count' => (int) $counts->get($status->value, 0),
            ])
            ->all();
    }

    /**
     * Vendors ranked by the value they have sold through confirmed sub-orders.
     *
     * @return array<int, array<string, mixed>>
     */
    private function topVendors(int $limit = 5): array
    {
        $revenueStatuses = array_map(
            fn (OrderStatus $status) => $status->value,
            array_filter(OrderStatus::cases(), fn (OrderStatus $status) => ! in_array(
                $status,
                [OrderStatus::Cancelled, OrderStatus::Refunded],
                true,
            )),
        );

        return SubOrder::query()
            ->whereIn('status', $revenueStatuses)
            ->selectRaw('vendor_id, sum(subtotal_price) as gross, sum(commission_amount) as commission, count(*) as orders')
            ->groupBy('vendor_id')
            ->orderByDesc('gross')
            ->limit($limit)
            ->with('vendor:id,store_name,slug')
            ->get()
            ->map(fn (SubOrder $row) => [
                'vendor' => $row->vendor === null ? null : [
                    'id' => $row->vendor->id,
                    'store_name' => $row->vendor->store_name,
                    'slug' => $row->vendor->slug,
                ],
                'gross' => (float) $row->gross,
                'commission' => (float) $row->commission,
                'orders' => (int) $row->orders,
            ])
            ->all();
    }

    /**
     * Most recent orders with the customer and item count attached.
     *
     * @return array<int, array<string, mixed>>
     */
    private function recentOrders(int $limit = 8): array
    {
        return Order::query()
            ->with('user:id,name,email')
            ->withCount('subOrders')
            ->latest('id')
            ->limit($limit)
            ->get()
            ->map(fn (Order $order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status?->value,
                'payment_status' => $order->payment_status?->value,
                'grand_total' => (float) $order->grand_total,
                'items_count' => (int) $order->sub_orders_count,
                'customer' => $order->user === null ? null : [
                    'id' => $order->user->id,
                    'name' => $order->user->name,
                    'email' => $order->user->email,
                ],
                'created_at' => $order->created_at?->toIso8601String(),
            ])
            ->all();
    }

    /**
     * Counts of everything waiting on an admin decision.
     *
     * @return array<string, int>
     */
    private function pendingQueues(): array
    {
        return [
            'vendors' => Vendor::query()->where('status', VendorStatus::Pending)->count(),
            'products' => Product::query()->where('status', ProductStatus::Pending)->count(),
            'unpaid_orders' => Order::query()->where('payment_status', PaymentStatus::Pending)->count(),
        ];
    }

    /**
     * A variant is "low" once available stock drops to this threshold or below.
     */
    private function lowStockVariants(int $threshold = 3): int
    {
        return (int) VendorInventory::query()
            ->where('is_available', true)
            ->whereRaw('(quantity - reserved_quantity) <= ?', [$threshold])
            ->count();
    }

    /**
     * Orders whose payment actually landed; revenue never counts failed attempts.
     *
     * @return Builder<Order>
     */
    private function revenueQuery(): Builder
    {
        return Order::query()->whereIn('payment_status', self::REVENUE_PAYMENT_STATUSES);
    }
}
