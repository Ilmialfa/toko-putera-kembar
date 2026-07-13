<?php

namespace App\Enums;

enum AttendanceType: string
{
    case CHECK_IN = 'check_in';
    case CHECK_OUT = 'check_out';
}
