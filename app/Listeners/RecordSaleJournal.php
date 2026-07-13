<?php

namespace App\Listeners;

use App\Domain\Finance\Services\JournalService;
use App\Domain\Sales\Events\SaleCompleted;

class RecordSaleJournal
{
    public function __construct(private readonly JournalService $journalService) {}

    /**
     * Handle the event.
     */
    public function handle(SaleCompleted $event): void
    {
        $this->journalService->recordSale($event->sale);
    }
}
