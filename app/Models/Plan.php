<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'tagline',
        'description',
        'monthly_price',
        'annual_price',
        'features',
        'highlighted',
        'is_active',
        'color',
        'sort_order',
    ];

    protected $casts = [
        'features' => 'array',
        'highlighted' => 'boolean',
        'is_active' => 'boolean',
        'monthly_price' => 'integer',
        'annual_price' => 'integer',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
