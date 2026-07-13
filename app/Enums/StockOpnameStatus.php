<?php

namespace App\Enums;

enum StockOpnameStatus: string
{
    case DRAFT = 'draft';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
}
