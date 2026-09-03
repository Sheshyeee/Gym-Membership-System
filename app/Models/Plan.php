<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    protected $fillable = ['name', 'slug', 'monthly_price', 'annual_price', 'is_active'];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    protected $casts = [
        'features' => 'array',
        'highlighted' => 'boolean',
    ];
}
