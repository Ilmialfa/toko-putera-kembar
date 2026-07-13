<?php

namespace App\Http\Requests\Storefront;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CustomerLoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'login' => ['required', 'string', 'max:150'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }

    public function authenticate(): void
    {
        $key = Str::lower($this->string('login')).'|'.$this->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages(['login' => 'Terlalu banyak percobaan masuk. Silakan coba lagi nanti.']);
        }

        $field = filter_var($this->string('login')->toString(), FILTER_VALIDATE_EMAIL) ? 'email' : 'phone';

        if (! Auth::guard('customer')->attempt([$field => $this->string('login')->toString(), 'password' => $this->string('password')->toString()], $this->boolean('remember'))) {
            RateLimiter::hit($key, 900);
            throw ValidationException::withMessages(['login' => 'Nomor HP/email atau kata sandi tidak sesuai.']);
        }

        RateLimiter::clear($key);
    }
}
