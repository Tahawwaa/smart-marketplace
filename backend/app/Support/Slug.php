<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Builds URL slugs that survive non-Latin scripts.
 *
 * Laravel's `Str::slug` transliterates through an ASCII map, so a Persian name
 * like "لوازم خانگی" collapses to "loazm-khangy" - readable to nobody and
 * useless for SEO. This helper keeps the original letters and only strips
 * punctuation, so the same input becomes "لوازم-خانگی".
 */
class Slug
{
    /**
     * Characters that differ between Arabic and Persian keyboards but mean the
     * same letter. Normalising first keeps "كتاب" and "کتاب" on one URL.
     */
    private const NORMALIZATIONS = [
        'ي' => 'ی',
        'ى' => 'ی',
        'ك' => 'ک',
        'ة' => 'ه',
        'ۀ' => 'ه',
        'أ' => 'ا',
        'إ' => 'ا',
        'آ' => 'ا',
        'ؤ' => 'و',
        'ئ' => 'ی',
        '٠' => '0',
        '١' => '1',
        '٢' => '2',
        '٣' => '3',
        '٤' => '4',
        '٥' => '5',
        '٦' => '6',
        '٧' => '7',
        '٨' => '8',
        '٩' => '9',
        '۰' => '0',
        '۱' => '1',
        '۲' => '2',
        '۳' => '3',
        '۴' => '4',
        '۵' => '5',
        '۶' => '6',
        '۷' => '7',
        '۸' => '8',
        '۹' => '9',
    ];

    /**
     * Turn a display name into a slug, falling back to the given default when
     * nothing usable is left.
     */
    public static function make(string $value, string $fallback = ''): string
    {
        $value = str_replace(
            array_keys(self::NORMALIZATIONS),
            array_values(self::NORMALIZATIONS),
            $value,
        );

        // Everything that is not a letter or a digit becomes a separator, so
        // spaces, dashes and punctuation all collapse into a single dash.
        $slug = preg_replace('/[^\p{L}\p{N}]+/u', '-', $value) ?? '';

        return Str::lower(trim($slug, '-')) ?: $fallback;
    }
}
