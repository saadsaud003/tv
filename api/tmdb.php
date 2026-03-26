<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Cache-Control: public, max-age=3600');

$API_KEY = '25139e4f6eccde28a014b9230c815e83';
$BASE = 'https://api.themoviedb.org/3';

$endpoint = isset($_GET['endpoint']) ? trim($_GET['endpoint'], '/') : '';
if (!$endpoint) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing endpoint']);
    exit;
}

// Whitelist allowed endpoints
$allowed = [
    'movie/popular', 'movie/top_rated', 'movie/now_playing', 'movie/upcoming',
    'tv/popular', 'tv/top_rated', 'tv/on_the_air', 'tv/airing_today',
    'trending/movie/week', 'trending/tv/week', 'trending/all/week',
    'search/movie', 'search/tv', 'search/multi',
    'genre/movie/list', 'genre/tv/list',
    'discover/movie', 'discover/tv'
];

// Allow detail endpoints like movie/123, tv/123, movie/123/videos, tv/123/season/1
$isDetail = preg_match('/^(movie|tv)\/\d+(\/.*)?$/', $endpoint);
if (!in_array($endpoint, $allowed) && !$isDetail) {
    http_response_code(403);
    echo json_encode(['error' => 'Endpoint not allowed']);
    exit;
}

$params = $_GET;
unset($params['endpoint']);
$params['api_key'] = $API_KEY;
if (!isset($params['language'])) $params['language'] = 'ar';

$url = $BASE . '/' . $endpoint . '?' . http_build_query($params);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_HTTPHEADER => ['Accept: application/json']
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(502);
    echo json_encode(['error' => 'Failed to fetch data']);
    exit;
}

http_response_code($httpCode);
echo $response;
