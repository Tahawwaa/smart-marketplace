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

        return response()->streamDownload(function () use ($vendor) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['sub_order_number', 'status', 'subtotal', 'commission', 'net', 'created_at']);

            $vendor->subOrders()->orderBy('id')->chunk(200, function ($rows) use ($handle) {
                foreach ($rows as $row) {
                    fputcsv($handle, [
                        $row->sub_order_number,
                        $row->status?->value,
                        $row->subtotal_price,
                        $row->commission_amount,
                        $row->vendor_net_amount,
                        $row->created_at?->toDateTimeString(),
                    ]);
                }
            });

            fclose($handle);
        }, 'vendor-orders.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
