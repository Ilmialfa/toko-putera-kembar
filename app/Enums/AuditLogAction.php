<?php

namespace App\Enums;

enum AuditLogAction: string
{
    case CREATE = 'create';
    case UPDATE = 'update';
    case DELETE = 'delete';
    case VOID = 'void';
    case APPROVE = 'approve';
    case LOGIN = 'login';
    case FAILED_LOGIN = 'failed_login';
}
