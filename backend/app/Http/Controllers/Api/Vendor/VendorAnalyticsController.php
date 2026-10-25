<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Services\VendorAnalyticsService;
use App\Services\VendorStoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VendorAnalyticsController extends VendorController
{
    public function __construct(
        private readonly VendorAnalyticsService $analytics,
        VendorStoreService $stores,
    ) {
        parent::__construct($stores);
    }

    public function show(Request $request): JsonResponse
    {
        $validated = $request->validate(['days' => ['nullable', 'integer', 'in:7,30,90']]);

        return response()->json([
            'data' => $this->analytics->summary($this->vendor($request), (int) ($validated['days'] ?? 30)),
        ]);
    }

    public function exportOrders(Request $request): StreamedResponse
    {
        $vendor = $this->vendor($request);
        $filters = $request->validate(['days' => ['nullable', 'integer', 'in:7,30,90']]);
        $days = $filters['days'] ?? null;

        return response()->streamDownload(function () use ($vendor, $days) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['sub_order_number', 'status', 'payment_status', 'subtotal_toman', 'commission_toman', 'net_toman', 'created_at'], escape: '');

            $vendor->subOrders()->whereHas('order')->with('order:id,payment_status')
                ->when($days, fn ($query) => $query->where('created_at', '>=', today()->subDays($days - 1))->where('created_at', '<', today()->addDay()))
                ->orderBy('id')->chunk(200, function ($rows) use ($handle) {
                foreach ($rows as $row) {
                    fputcsv($handle, [
                        preg_match('/^[=+@\-\t\r]/', $row->sub_order_number) ? "'".$row->sub_order_number : $row->sub_order_number,
                        $row->status?->value,
                        $row->order?->payment_status?->value,
                        $row->subtotal_price,
                        $row->commission_amount,
                        $row->vendor_net_amount,
                        $row->created_at?->toDateTimeString(),
                    ], escape: '');
                }
            });

            fclose($handle);
        }, 'vendor-orders.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
