<?php

namespace App\Domain\Inventory\Services;

class WacCalculationService
{
    /**
     * Calculate the new Weighted Average Cost (WAC) / HPP.
     *
     * Formula:
     * Valuasi_Lama = Sisa_Stok_Lama * HPP_Lama
     * Valuasi_Baru = Valuasi_Lama + Total_Tagihan_Faktur_Baru
     * HPP_Baru = Valuasi_Baru / (Sisa_Stok_Lama + Qty_Masuk_Baru)
     *
     * @param  float  $incomingTotalPrice  The total price of the incoming items (Qty * Price)
     */
    public function calculateNewHpp(float $currentQty, float $currentHpp, float $incomingQty, float $incomingTotalPrice): float
    {
        // If current qty is less than or equal to 0,
        // the new HPP is simply the incoming unit price.
        if ($currentQty <= 0) {
            return $incomingQty > 0 ? round($incomingTotalPrice / $incomingQty, 4) : 0;
        }

        $oldValuation = $currentQty * $currentHpp;
        $newValuation = $oldValuation + $incomingTotalPrice;
        $totalQty = $currentQty + $incomingQty;

        if ($totalQty <= 0) {
            return 0; // Prevent division by zero, though technically impossible given the condition above
        }

        return round($newValuation / $totalQty, 4);
    }
}
