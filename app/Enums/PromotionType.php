<?php

namespace App\Enums;

enum PromotionType: string
{
    case DISCOUNT_ITEM = 'discount_item';
    case DISCOUNT_CATEGORY = 'discount_category';
    case VOUCHER = 'voucher';
    case BUNDLING = 'bundling';
    case BXGY = 'bxgy';
    case CASHBACK = 'cashback';
    case LOYALTY_POINT = 'loyalty_point';
}
