<?php
// Stream proxy for CORS-restricted content
$url = isset($_GET['url']) ? trim($_GET['url']) : '';

if (!$url || !filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo 'Invalid URL';
    exit;
}

// Only allow media-related URLs
$allowed_hosts = [
    'iptv-org.github.io',
    'raw.githubusercontent.com',
    'github.com',
    'api.themoviedb.org',
    'image.tmdb.org'
];

$host = parse_url($url, PHP_URL_HOST);
$isAllowed = false;
foreach ($allowed_hosts as $ah) {
    if ($host === $ah || str_ends_with($host, '.' . $ah)) {
        $isAllowed = true;
        break;
    }
}

// Allow .m3u8 and .ts streams from any host for IPTV
$path = parse_url($url, PHP_URL_PATH);
$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
$mediaExts = ['m3u8', 'ts', 'm3u', 'mpd', 'srt', 'vtt', 'sub', 'ass'];
if (in_array($ext, $mediaExts)) {
    $isAllowed = true;
}

if (!$isAllowed) {
    http_response_code(403);
    echo 'Host not allowed';
    exit;
}

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_USERAGENT => $_SERVER['HTTP_USER_AGENT'] ?? 'ArabTV/1.0',
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_HTTPHEADER => ['Accept: */*']
]);

// Forward range headers for streaming
if (isset($_SERVER['HTTP_RANGE'])) {
    curl_setopt($ch, CURLOPT_RANGE, str_replace('bytes=', '', $_SERVER['HTTP_RANGE']));
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(502);
    echo 'Proxy error';
    exit;
}

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
header('Access-Control-Allow-Headers: Range');

// Forward content type
if ($contentType) {
    header('Content-Type: ' . $contentType);
} elseif ($ext === 'm3u8') {
    header('Content-Type: application/vnd.apple.mpegurl');
} elseif ($ext === 'ts') {
    header('Content-Type: video/mp2t');
} elseif ($ext === 'srt' || $ext === 'vtt') {
    header('Content-Type: text/plain; charset=utf-8');
}

http_response_code($httpCode);

// For m3u8, rewrite internal URLs to go through proxy
if ($ext === 'm3u8' && $response) {
    $baseUrl = dirname($url);
    $lines = explode("\n", $response);
    $output = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line && $line[0] !== '#') {
            if (!preg_match('/^https?:\/\//', $line)) {
                $line = $baseUrl . '/' . $line;
            }
            $line = '/s/tv/api/proxy.php?url=' . urlencode($line);
        }
        $output[] = $line;
    }
    echo implode("\n", $output);
} else {
    echo $response;
}
