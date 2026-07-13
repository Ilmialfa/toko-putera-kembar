<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case PAID = 'paid';
    case CREDIT = 'credit';
    case PARTIAL = 'partial';
    case UNPAID = 'unpaid';
}
