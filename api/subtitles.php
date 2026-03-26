<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

$tmdb_id = isset($_GET['tmdb_id']) ? intval($_GET['tmdb_id']) : 0;
$imdb_id = isset($_GET['imdb_id']) ? trim($_GET['imdb_id']) : '';
$title = isset($_GET['title']) ? trim($_GET['title']) : '';
$season = isset($_GET['season']) ? intval($_GET['season']) : 0;
$episode = isset($_GET['episode']) ? intval($_GET['episode']) : 0;
$lang = isset($_GET['lang']) ? trim($_GET['lang']) : 'ara';
$type = isset($_GET['type']) ? trim($_GET['type']) : 'movie';
$action = isset($_GET['action']) ? trim($_GET['action']) : 'search';

// Download specific subtitle
if ($action === 'download' && isset($_GET['url'])) {
    $subUrl = $_GET['url'];
    header('Content-Type: text/plain; charset=utf-8');
    $ch = curl_init($subUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_USERAGENT => 'ArabTV/1.0'
    ]);
    $data = curl_exec($ch);
    curl_close($ch);
    echo $data;
    exit;
}

if (!$tmdb_id && !$imdb_id && !$title) {
    echo json_encode(['error' => 'Missing search parameters', 'results' => []]);
    exit;
}

$results = [];

// 1. OpenSubtitles.com REST API (free tier)
function searchOpenSubtitles($imdb_id, $tmdb_id, $season, $episode, $lang) {
    $params = ['languages' => $lang];
    if ($imdb_id) $params['imdb_id'] = $imdb_id;
    elseif ($tmdb_id) $params['tmdb_id'] = $tmdb_id;
    if ($season) $params['season_number'] = $season;
    if ($episode) $params['episode_number'] = $episode;

    $url = 'https://api.opensubtitles.com/api/v1/subtitles?' . http_build_query($params);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => [
            'Api-Key: bBtYEbaAhEMFkqET',
            'Content-Type: application/json',
            'User-Agent: ArabTV v1.0'
        ]
    ]);
    $response = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $subs = [];
    if ($code === 200 && $response) {
        $data = json_decode($response, true);
        if (isset($data['data'])) {
            foreach (array_slice($data['data'], 0, 10) as $item) {
                $attr = $item['attributes'] ?? [];
                $files = $attr['files'] ?? [];
                $fileId = !empty($files) ? $files[0]['file_id'] : null;
                $subs[] = [
                    'source' => 'OpenSubtitles',
                    'language' => $attr['language'] ?? $lang,
                    'name' => $attr['release'] ?? 'Unknown',
                    'rating' => $attr['ratings'] ?? 0,
                    'download_count' => $attr['download_count'] ?? 0,
                    'file_id' => $fileId,
                    'format' => 'srt'
                ];
            }
        }
    }
    return $subs;
}

// 2. Podnapisi
function searchPodnapisi($title, $season, $episode, $lang) {
    $langMap = ['ara' => 'ar', 'eng' => 'en', 'fre' => 'fr'];
    $pLang = $langMap[$lang] ?? 'ar';

    $params = ['keywords' => $title, 'language' => $pLang];
    if ($season) $params['seasons'] = $season;
    if ($episode) $params['episodes'] = $episode;

    $url = 'https://www.podnapisi.net/subtitles/search/old?' . http_build_query($params);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => ['Accept: application/xml'],
        CURLOPT_USERAGENT => 'ArabTV/1.0'
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $subs = [];
    if ($response) {
        libxml_use_internal_errors(true);
        $xml = @simplexml_load_string($response);
        if ($xml && isset($xml->subtitle)) {
            foreach (array_slice((array)$xml->subtitle, 0, 10) as $sub) {
                $subs[] = [
                    'source' => 'Podnapisi',
                    'language' => $pLang,
                    'name' => (string)($sub->release ?? $title),
                    'rating' => (float)($sub->rating ?? 0),
                    'download_count' => (int)($sub->downloads ?? 0),
                    'url' => (string)($sub->url ?? ''),
                    'format' => 'srt'
                ];
            }
        }
    }
    return $subs;
}

// 3. YTS Subtitles (movies only)
function searchYTS($imdb_id) {
    if (!$imdb_id) return [];

    $url = 'https://yts-subs.com/movie-imdb/' . $imdb_id;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT => 'ArabTV/1.0'
    ]);
    $html = curl_exec($ch);
    curl_close($ch);

    $subs = [];
    if ($html && preg_match_all('/<tr[^>]*>.*?arabic.*?<a[^>]+href="([^"]+)"[^>]*>.*?<\/tr>/si', $html, $matches)) {
        foreach (array_slice($matches[1], 0, 5) as $link) {
            $subs[] = [
                'source' => 'YTS',
                'language' => 'ar',
                'name' => basename($link),
                'url' => $link,
                'format' => 'srt'
            ];
        }
    }
    return $subs;
}

// 4. Subscene
function searchSubscene($title, $season, $episode, $lang) {
    $langMap = [
        'ara' => 'arabic', 'eng' => 'english', 'fre' => 'french', 'spa' => 'spanish',
        'deu' => 'german', 'por' => 'portuguese', 'tur' => 'turkish', 'ita' => 'italian',
        'rus' => 'russian', 'kor' => 'korean', 'jpn' => 'japanese', 'zho' => 'chinese',
        'fas' => 'farsi_persian', 'hin' => 'hindi', 'urd' => 'urdu'
    ];
    $sLang = $langMap[$lang] ?? 'arabic';

    $search = $title;
    if ($season && $episode) {
        $search .= ' S' . str_pad($season, 2, '0', STR_PAD_LEFT) . 'E' . str_pad($episode, 2, '0', STR_PAD_LEFT);
    }

    $url = 'https://subscene.com/subtitles/searchbytitle?query=' . urlencode($search);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        CURLOPT_SSL_VERIFYPEER => false
    ]);
    $html = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $subs = [];
    if ($code === 200 && $html) {
        // Extract subtitle page links
        if (preg_match_all('/<a href="(\/subtitles\/[^"]+)"[^>]*>/i', $html, $matches)) {
            $pageUrl = 'https://subscene.com' . $matches[1][0];

            // Fetch the subtitle listing page
            $ch2 = curl_init($pageUrl);
            curl_setopt_array($ch2, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                CURLOPT_SSL_VERIFYPEER => false
            ]);
            $subPage = curl_exec($ch2);
            curl_close($ch2);

            if ($subPage) {
                // Match rows for the target language
                $pattern = '/<td class="a1">.*?<a href="(\/subtitles\/[^"]+)"[^>]*>.*?<span class="l r [^"]*">\s*' . preg_quote($sLang, '/') . '\s*<\/span>.*?<span>\s*([^<]+)<\/span>.*?<\/a>.*?<\/td>/si';
                if (preg_match_all($pattern, $subPage, $subMatches, PREG_SET_ORDER)) {
                    foreach (array_slice($subMatches, 0, 8) as $m) {
                        $subs[] = [
                            'source' => 'Subscene',
                            'language' => $lang,
                            'name' => trim($m[2]),
                            'url' => 'https://subscene.com' . trim($m[1]),
                            'format' => 'srt'
                        ];
                    }
                }
            }
        }
    }
    return $subs;
}

// Aggregate results
$results = array_merge(
    searchOpenSubtitles($imdb_id, $tmdb_id, $season, $episode, $lang),
    searchPodnapisi($title, $season, $episode, $lang),
    searchSubscene($title, $season, $episode, $lang),
    ($type === 'movie') ? searchYTS($imdb_id) : []
);

echo json_encode([
    'total' => count($results),
    'results' => $results
], JSON_UNESCAPED_UNICODE);
