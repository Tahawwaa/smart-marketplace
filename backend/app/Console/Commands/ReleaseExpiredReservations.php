<?php

namespace App\Console\Commands;

use App\Services\InventoryService;
use Illuminate\Console\Command;

class ReleaseExpiredReservations extends Command
{
    protected $signature = 'inventory:release-expired';

    protected $description = 'Release expired inventory reservations back to available stock';

    public function handle(InventoryService $inventory): int
    {
        $released = $inventory->releaseExpired();

        $this->info("Released {$released} expired reservation(s).");

        return self::SUCCESS;
    }
}
