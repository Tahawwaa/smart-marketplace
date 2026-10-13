<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Allow only accounts carrying the admin role through.
     *
     * The admin surface is deliberately gated by one middleware instead of a
     * policy-per-route setup: every admin controller inherits from
     * `App\Http\Controllers\Api\Admin\AdminController`, which lives behind this
     * guard, so a stray route cannot accidentally expose marketplace data.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_if($user === null, 401);
        abort_unless($user->isAdmin(), 403, 'این بخش فقط برای مدیران است.');

        return $next($request);
    }
}
