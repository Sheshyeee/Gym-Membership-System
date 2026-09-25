<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Dynamic theme-color meta tag: kept in sync with the 'dark' class via JS below.
         This is what tints Safari/Chrome's own toolbar/status-bar chrome. --}}
    <meta name="theme-color" id="theme-color-meta" content="#ffffff">

    {{-- Lets the site run edge-to-edge with no browser chrome when added to the
         home screen (standalone PWA mode). Inert in a normal browser tab. --}}
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="{{ config('app.name', 'Laravel') }}">

    <link rel="manifest" href="/manifest.json">

    {{-- Inline script to detect system dark mode preference and apply it immediately --}}
    <script>
        (function() {
            const appearance = '{{ $appearance ?? 'system' }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    {{-- Keeps the theme-color meta tag (browser chrome tint) in sync with the
         'dark' class on <html>, whether that class was set by the system-preference
         script above OR by the user's manual in-app toggle (AppearanceToggleIcon). --}}
    <script>
        (function() {
            const meta = document.getElementById('theme-color-meta');

            // Match these to your --background oklch values converted to hex.
            const LIGHT = '#ffffff';
            const DARK = '#0d0d0d';

            function syncThemeColor() {
                const isDark = document.documentElement.classList.contains('dark');
                meta.setAttribute('content', isDark ? DARK : LIGHT);
            }

            syncThemeColor();

            new MutationObserver(syncThemeColor).observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class'],
            });
        })();
    </script>

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <style>
        html {
            background-color: oklch(1 0 0);
            height: 100%;
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }

        body {
            min-height: 100dvh;
            min-height: -webkit-fill-available;
        }
    </style>

    <link rel="icon" href="{{ $gymProfile->cover_url ?? '/favicon.ico' }}" sizes="any">
    @if (!$gymProfile->cover_url)
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    @endif
    <link rel="apple-touch-icon" href="{{ $gymProfile->cover_url ?? '/apple-touch-icon.png' }}">

    @fonts

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    <x-inertia::head>
        <title>{{ config('app.name', 'Laravel') }}</title>
    </x-inertia::head>
</head>

<body class="font-sans antialiased">
    <x-inertia::app />
</body>

</html>
