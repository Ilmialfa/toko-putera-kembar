<?php

namespace App\Enums;

enum Channel: string
{
    case POS = 'pos';
    case ONLINE = 'online';
    case BOTH = 'both';
}
