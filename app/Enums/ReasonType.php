<?php

namespace App\Enums;

enum ReasonType: string
{
    case WASTE = 'waste';
    case DAMAGED = 'damaged';
    case LOST = 'lost';
    case INTERNAL_USE = 'internal_use';
}
