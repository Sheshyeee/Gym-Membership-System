<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

#[Fillable(['name', 'phone', 'address', 'about', 'cover_path'])]
class GymProfile extends Model
{
    protected $appends = ['cover_url'];

    public static function current(): self
    {
        return static::firstOrCreate(['id' => 1], ['name' => 'My Gym']);
    }

    public function getCoverUrlAttribute(): ?string
    {
        if (! $this->cover_path) {
            return null;
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('s3');

        return $disk->url($this->cover_path);
    }
}