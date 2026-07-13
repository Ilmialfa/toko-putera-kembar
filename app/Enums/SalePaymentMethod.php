<?php

namespace App\Enums;

enum SalePaymentMethod: string
{
    case CASH = 'cash';
    case QRIS = 'qris';
    case BANK_TRANSFER = 'bank_transfer';
    case E_WALLET = 'e_wallet';
    case DEBIT_CARD = 'debit_card';
    case CREDIT_CARD = 'credit_card';
    case PIUTANG = 'piutang';
    case POINTS = 'points';
}
