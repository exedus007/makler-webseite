<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

function respond(int $statusCode, array $data): void
{
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function clean(string $value): string
{
    return trim($value);
}

function appEnv(string $key, ?string $fallback = null): ?string
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        return $fallback;
    }

    return $value;
}

function ensurePostRequest(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        respond(405, [
            'success' => false,
            'message' => 'Ungültige Anfrage.'
        ]);
    }
}

function validateSameOriginRequest(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $secFetchSite = strtolower($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '');

    if ($secFetchSite !== '' && !in_array($secFetchSite, ['same-origin', 'same-site', 'none'], true)) {
        respond(403, [
            'success' => false,
            'message' => 'Die Anfrage konnte aus Sicherheitsgründen nicht verarbeitet werden.'
        ]);
    }

    if ($origin !== '' && $host !== '') {
        $originHost = parse_url($origin, PHP_URL_HOST);
        if (is_string($originHost) && $originHost !== '' && !hash_equals($host, $originHost)) {
            respond(403, [
                'success' => false,
                'message' => 'Die Anfrage konnte aus Sicherheitsgründen nicht verarbeitet werden.'
            ]);
        }
    }
}

function enforceRateLimit(string $scope, int $maxRequests = 5, int $windowSeconds = 300): void
{
    $storageDir = __DIR__ . '/storage/rate-limits';
    if (!is_dir($storageDir) && !mkdir($storageDir, 0775, true) && !is_dir($storageDir)) {
        appLog('Konnte Rate-Limit-Verzeichnis nicht anlegen.', ['scope' => $scope]);
        return;
    }

    $clientIp = clean($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $key = hash('sha256', $scope . '|' . $clientIp);
    $file = $storageDir . '/' . $key . '.json';
    $now = time();
    $timestamps = [];

    if (is_file($file)) {
        $raw = file_get_contents($file);
        $decoded = json_decode((string) $raw, true);
        if (is_array($decoded)) {
            $timestamps = array_values(array_filter(
                $decoded,
                static fn($timestamp): bool => is_int($timestamp) && $timestamp > ($now - $windowSeconds)
            ));
        }
    }

    if (count($timestamps) >= $maxRequests) {
        respond(429, [
            'success' => false,
            'message' => 'Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es in wenigen Minuten erneut.'
        ]);
    }

    $timestamps[] = $now;
    file_put_contents($file, json_encode($timestamps), LOCK_EX);
}

function appLog(string $message, array $context = []): void
{
    $logDir = __DIR__ . '/storage/logs';
    if (!is_dir($logDir) && !mkdir($logDir, 0775, true) && !is_dir($logDir)) {
        error_log($message . ' ' . json_encode($context, JSON_UNESCAPED_UNICODE));
        return;
    }

    $entry = sprintf(
        "[%s] %s %s%s",
        date('c'),
        $message,
        $context ? json_encode($context, JSON_UNESCAPED_UNICODE) : '',
        PHP_EOL
    );

    error_log($entry, 3, $logDir . '/app.log');
}

function createConfiguredMailer(): PHPMailer
{
    $smtpHost = appEnv('MAIL_HOST', 'smtp.ionos.de');
    $smtpPort = (int) appEnv('MAIL_PORT', '587');
    $smtpUsername = appEnv('MAIL_USERNAME', 'info@deine-domain.de');
    $smtpPassword = appEnv('MAIL_PASSWORD', 'HIER_IHR_EMAIL_PASSWORT_EINTRAGEN');
    $smtpEncryption = appEnv('MAIL_ENCRYPTION', PHPMailer::ENCRYPTION_STARTTLS);

    $mailer = new PHPMailer(true);
    $mailer->isSMTP();
    $mailer->Host = $smtpHost;
    $mailer->SMTPAuth = true;
    $mailer->Username = $smtpUsername;
    $mailer->Password = $smtpPassword;
    $mailer->SMTPSecure = $smtpEncryption;
    $mailer->Port = $smtpPort;
    $mailer->CharSet = 'UTF-8';
    $mailer->Timeout = 15;

    return $mailer;
}

function getMailSettings(): array
{
    return [
        'companyName' => appEnv('COMPANY_NAME', 'Deisterblick Immobilien'),
        'receiverEmail' => appEnv('RECEIVER_EMAIL', 'info@deine-domain.de'),
        'receiverName' => appEnv('RECEIVER_NAME', 'Deisterblick Immobilien'),
        'fromEmail' => appEnv('FROM_EMAIL', 'info@deine-domain.de'),
        'fromName' => appEnv('FROM_NAME', 'Deisterblick Immobilien Website'),
    ];
}
