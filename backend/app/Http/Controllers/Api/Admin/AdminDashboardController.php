<?php

namespace App\Http\Controllers\Api\Admin;

use App\Services\AdminDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends AdminController
{
    public function __construct(private readonly AdminDashboardService $dashboard) {}

    public function show(Request $request): JsonResponse
    {
        $days = $request->integer('trend_days', 14);

        return response()->json([
            'data' => $this->dashboard->overview(max(min($days, 90), 1)),
        ]);
    }
}
