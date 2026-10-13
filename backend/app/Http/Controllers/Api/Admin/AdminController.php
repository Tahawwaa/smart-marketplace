<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

abstract class AdminController extends Controller
{
    // Routes extending this controller are mounted behind the `admin`
    // middleware in routes/api.php.

    private const DEFAULT_PER_PAGE = 20;

    private const MAX_PER_PAGE = 100;

    /**
     * Clamp the caller's page size so a single request cannot pull the whole table.
     */
    protected function perPage(Request $request): int
    {
        return max(1, min($request->integer('per_page', self::DEFAULT_PER_PAGE), self::MAX_PER_PAGE));
    }
}
