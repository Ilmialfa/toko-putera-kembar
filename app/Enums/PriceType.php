<?php

namespace App\Enums;

enum PriceType: string
{
    case RETAIL = 'retail';
    case WHOLESALE_TIER = 'wholesale_tier';
    case MEMBER = 'member';
    case RESELLER = 'reseller';
    case PROMO = 'promo';
}
