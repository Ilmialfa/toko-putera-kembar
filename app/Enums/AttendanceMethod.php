<?php

namespace App\Enums;

enum AttendanceMethod: string
{
    case PHOTO_GEO = 'photo_geo';
    case BARCODE_KIOSK = 'barcode_kiosk';
}
