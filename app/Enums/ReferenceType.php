<?php

namespace App\Enums;

enum ReferenceType: string
{
    case SALE = 'sale';
    case ORDER = 'order';
    case STOCK_IN = 'stock_in';
    case STOCK_TRANSFER = 'stock_transfer';
    case STOCK_OPNAME = 'stock_opname';
    case STOCK_OUT_ADJUSTMENT = 'stock_out_adjustment';
    case SUPPLIER_RETURN = 'supplier_return';
}
